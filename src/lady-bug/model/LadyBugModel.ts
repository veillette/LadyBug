/**
 * LadyBugModel.ts
 *
 * The simulation model: drives the ladybug, records its state over time, and plays
 * it back. Ported from the original Ladybug Motion sim (LadybugMotionSimulation +
 * its Simulation base). Backbone change-events become axon Properties/Emitters and
 * the object pools are dropped (axon handles change notification).
 */

import { BooleanProperty, Emitter, NumberProperty, Property } from "scenerystack/axon";
import { Bounds2, Vector2 } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { closestIndex } from "./binarySearch.js";
import LadyBugConstants from "./LadyBugConstants.js";
import Ladybug from "./Ladybug.js";
import LadybugMover, { type MoverContext } from "./LadybugMover.js";
import LadybugStateRecord from "./LadybugStateRecord.js";
import { MotionType } from "./MotionType.js";
import { estimateDerivative, type TimeValue } from "./motionMath.js";
import SamplingMotionModel from "./SamplingMotionModel.js";
import { UpdateMode } from "./UpdateMode.js";

export type TraceMode = "line" | "dots" | "off";

type PenPoint = { time: number; x: number; y: number };

export class LadyBugModel implements TModel, MoverContext {
  public readonly ladybug = new Ladybug();

  // Observable state.
  public readonly motionTypeProperty = new Property<MotionType>(MotionType.MANUAL);
  public readonly updateModeProperty = new Property<UpdateMode>(UpdateMode.POSITION);
  public readonly recordingProperty = new BooleanProperty(true);
  public readonly isPlayingProperty = new BooleanProperty(false);
  public readonly timeProperty = new NumberProperty(0);
  public readonly furthestRecordedTimeProperty = new NumberProperty(0);
  public readonly showVelocityProperty = new BooleanProperty(true);
  public readonly showAccelerationProperty = new BooleanProperty(true);
  public readonly traceModeProperty = new Property<TraceMode>("line");

  // Fired when a state record is appended / when history is removed.
  public readonly historyAddedEmitter = new Emitter();
  public readonly historyRemovedEmitter = new Emitter();

  public readonly maxRecordingTime = LadyBugConstants.MAX_RECORDING_TIME;

  // Plain (non-observable) state.
  private readonly mover = new LadybugMover(this);
  private readonly samplingMotionModel = new SamplingMotionModel(
    LadyBugConstants.SAMPLING_HALF_WINDOW,
    LadyBugConstants.SAMPLING_NUM_AVERAGED,
    0,
    0,
  );
  private readonly penPath: PenPoint[] = [];
  private penDown = false;
  private penPoint = new Vector2(0, 0);
  private readonly stateHistory: LadybugStateRecord[] = [];
  public readonly culledStateHistory: LadybugStateRecord[] = [];
  private historyTimes: number[] | null = null;
  private bounds = new Bounds2(
    -LadyBugConstants.SCENE_DIAMETER / 2,
    -LadyBugConstants.SCENE_DIAMETER / 2,
    LadyBugConstants.SCENE_DIAMETER / 2,
    LadyBugConstants.SCENE_DIAMETER / 2,
  );

  private time = 0;
  private timeAccumulator = 0;

  public constructor() {
    this.recordingProperty.lazyLink((recording) => {
      if (!recording) {
        this.prepareForPlayback();
      }
    });
    this.isPlayingProperty.lazyLink((isPlaying) => this.pausedChanged(!isPlaying));
    this.updateModeProperty.lazyLink((mode) => {
      if (mode === UpdateMode.POSITION) {
        this.clearSampleHistory();
        this.resetSamplingMotionModel();
      }
    });
    this.motionTypeProperty.lazyLink((type) => this.mover.setMotionType(type));
  }

  // ── Stepping ────────────────────────────────────────────────────────────────

  public step(dt: number): void {
    if (!this.isPlayingProperty.value) {
      return;
    }
    const fixed = LadyBugConstants.FIXED_DT;
    this.timeAccumulator = Math.min(this.timeAccumulator + dt, fixed * LadyBugConstants.MAX_CATCHUP_STEPS);
    while (this.timeAccumulator >= fixed && this.isPlayingProperty.value) {
      this.timeAccumulator -= fixed;
      this.stepInternal(fixed);
    }
  }

  /** Advance exactly one fixed slice, regardless of play state (the Step button). */
  public stepOnce(): void {
    this.stepInternal(LadyBugConstants.FIXED_DT);
  }

  private stepInternal(deltaTime: number): void {
    this.time += deltaTime;
    this.timeProperty.value = this.time;

    if (this.recordingProperty.value) {
      this.stepRecording(deltaTime);
    } else {
      this.stepPlayback();
    }
  }

  private stepRecording(deltaTime: number): void {
    this.mover.update(deltaTime);
    this.recordCurrentPenPoint();
    this.trimSampleHistory();
    if (this.mover.isManual()) {
      this.updateManualMovement(deltaTime);
    }
    this.recordState();
    this.furthestRecordedTimeProperty.value = this.time;
  }

  private stepPlayback(): void {
    this.applyPlaybackState();
    if (this.time >= this.furthestRecordedTimeProperty.value) {
      this.pause();
    }
  }

  private updateManualMovement(deltaTime: number): void {
    if (this.penDown) {
      this.updatePositionMode(deltaTime);
      return;
    }
    switch (this.updateModeProperty.value) {
      case UpdateMode.POSITION:
        this.updatePositionMode(deltaTime);
        break;
      case UpdateMode.VELOCITY:
        this.updateVelocityMode(deltaTime);
        break;
      case UpdateMode.ACCELERATION:
        this.updateAccelerationMode(deltaTime);
        break;
    }
  }

  public updatePositionMode(deltaTime: number): void {
    if (this.penPath.length > 2) {
      this.samplingMotionModel.addPointAndUpdate(this.getLastSamplePoint());
      this.ladybug.setPosition(this.samplingMotionModel.getAverageMid());

      // Fudge factors (from PhET) that put the model v and a on the right scale for
      // the fixed timestep. With deltaTime = FIXED_DT these are constant.
      const vscale = 1 / deltaTime / 10;
      const ascale = vscale * vscale * 3.835;
      this.ladybug.setVelocity(this.samplingMotionModel.getVelocity().timesScalar(vscale));
      this.ladybug.setAcceleration(this.samplingMotionModel.getAcceleration().timesScalar(ascale));
    } else {
      this.ladybug.setVelocityXY(0, 0);
      this.ladybug.setAccelerationXY(0, 0);
    }
    this.pointInDirectionOfMotion();
  }

  private updateVelocityMode(deltaTime: number): void {
    if (this.penPath.length > 0) {
      this.samplingMotionModel.addPointAndUpdate(this.getLastSamplePoint());
    }
    this.ladybug.updatePositionFromVelocity(deltaTime);
    this.ladybug.setAcceleration(this.estimateAcceleration());
    this.pointInDirectionOfMotion();
  }

  private updateAccelerationMode(deltaTime: number): void {
    this.ladybug.updatePositionFromVelocity(deltaTime);
    this.ladybug.updateVelocity(deltaTime);
    this.pointInDirectionOfMotion();
  }

  // ── Sampling (the virtual "pen" that draws where the ladybug should go) ───────

  public initManual(): void {
    this.resetSamplingMotionModel();
    this.clearSampleHistory();
  }

  public startSampling(): void {
    this.penDown = true;
  }

  public stopSampling(): void {
    this.penDown = false;
  }

  public setSamplePoint(point: Vector2): void {
    this.penPoint = new Vector2(point.x, point.y);
  }

  private recordCurrentPenPoint(): void {
    this.penPath.push({ time: this.time, x: this.penPoint.x, y: this.penPoint.y });
  }

  private getLastSamplePoint(): Vector2 {
    const last = this.penPath[this.penPath.length - 1];
    return last ? new Vector2(last.x, last.y) : new Vector2(0, 0);
  }

  private trimSampleHistory(): void {
    while (this.penPath.length > LadyBugConstants.PEN_PATH_MAX) {
      this.penPath.shift();
    }
  }

  public clearSampleHistory(): void {
    this.penPath.length = 0;
    this.penPoint = new Vector2(0, 0);
  }

  public resetSamplingMotionModel(): void {
    this.samplingMotionModel.reset(this.ladybug.position);
  }

  // ── State history (record / playback) ─────────────────────────────────────────

  private recordState(): void {
    const record = new LadybugStateRecord();
    record.record(this.time, this.ladybug);

    if (!this.stateMatchesPrevious(record)) {
      this.culledStateHistory.push(record);
    }
    this.stateHistory.push(record);
    this.historyAddedEmitter.emit();
  }

  private stateMatchesPrevious(state: LadybugStateRecord): boolean {
    const last = this.stateHistory[this.stateHistory.length - 1];
    return this.stateHistory.length > 1 && last !== undefined && last.position.equals(state.position);
  }

  private applyPlaybackState(): void {
    const record = this.findStateWithClosestTime(this.time);
    if (record) {
      record.apply(this.ladybug);
    }
  }

  private findStateWithClosestTime(time: number): LadybugStateRecord | null {
    if (!this.historyTimes) {
      return null;
    }
    const index = closestIndex(this.historyTimes, time);
    return this.stateHistory[index] ?? null;
  }

  private prepareForPlayback(): void {
    this.stateHistory.sort((a, b) => a.time - b.time);
    this.historyTimes = this.stateHistory.map((state) => state.time);
  }

  private pausedChanged(paused: boolean): void {
    if (paused) {
      this.prepareForPlayback();
    } else if (!this.recordingProperty.value) {
      this.prepareForPlayback();
    } else {
      this.clearHistoryAfter(this.time);
    }
  }

  public clearHistory(): void {
    this.stateHistory.length = 0;
    this.culledStateHistory.length = 0;
    this.clearSampleHistory();
    this.historyRemovedEmitter.emit();
  }

  private clearHistoryAfter(time: number): void {
    for (let i = this.stateHistory.length - 1; i >= 0; i--) {
      if ((this.stateHistory[i]?.time ?? 0) >= time) {
        this.stateHistory.splice(i, 1);
      }
    }
    for (let i = this.culledStateHistory.length - 1; i >= 0; i--) {
      if ((this.culledStateHistory[i]?.time ?? 0) >= time) {
        this.culledStateHistory.splice(i, 1);
      }
    }
    this.historyTimes = null;
    this.furthestRecordedTimeProperty.value = time;

    if (this.penDown) {
      this.clearSampleHistory();
      this.resetSamplingMotionModel();
    }
    this.historyRemovedEmitter.emit();
  }

  // ── Public controls ───────────────────────────────────────────────────────────

  public play(): void {
    this.isPlayingProperty.value = true;
  }

  public pause(): void {
    this.isPlayingProperty.value = false;
  }

  public clear(): void {
    const wasPlaying = this.isPlayingProperty.value;
    this.pause();
    this.time = 0;
    this.timeProperty.value = 0;
    this.furthestRecordedTimeProperty.value = 0;
    this.clearHistory();
    if (wasPlaying) {
      this.play();
    }
  }

  public rewind(): void {
    this.pause();
    this.time = 0;
    this.timeProperty.value = 0;
    this.applyPlaybackState();
    if (this.recordingProperty.value) {
      this.clearHistory();
    }
  }

  public setTime(time: number): void {
    this.time = time;
    this.timeProperty.value = time;
    this.applyPlaybackState();
  }

  public returnLadybug(): void {
    this.ladybug.setPositionXY(0, 0);
    this.ladybug.setVelocityXY(0, 0);
    this.clearSampleHistory();
    this.setSamplePoint(this.ladybug.position);
    this.resetSamplingMotionModel();
  }

  public ladybugOutOfBounds(): boolean {
    return !this.bounds.containsPoint(this.ladybug.position);
  }

  public setBounds(minX: number, minY: number, maxX: number, maxY: number): void {
    this.bounds = new Bounds2(minX, minY, maxX, maxY);
  }

  public getBounds(): Bounds2 {
    return this.bounds;
  }

  // ── Derivative estimation ─────────────────────────────────────────────────────

  public estimateVelocity(): Vector2 {
    return this.estimateDerivativeVector((state) => state.position);
  }

  public estimateAcceleration(): Vector2 {
    return this.estimateDerivativeVector((state) => state.velocity);
  }

  private estimateDerivativeVector(getValue: (state: LadybugStateRecord) => Vector2): Vector2 {
    const size = LadyBugConstants.ESTIMATION_SAMPLE_SIZE;
    const sample = this.stateHistory.slice(Math.max(0, this.stateHistory.length - size));
    const diff = size - sample.length;

    const xs: TimeValue[] = [];
    const ys: TimeValue[] = [];
    for (let j = 0; j < diff; j++) {
      xs.push({ time: 0, value: 0 });
      ys.push({ time: 0, value: 0 });
    }
    for (const state of sample) {
      const v = getValue(state);
      xs.push({ time: state.time, value: v.x });
      ys.push({ time: state.time, value: v.y });
    }
    return new Vector2(estimateDerivative(xs), estimateDerivative(ys));
  }

  private pointInDirectionOfMotion(): void {
    const velocity = this.estimateVelocity();
    if (velocity.magnitude > 1e-6) {
      this.ladybug.setAngle(velocity.angle);
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────────

  public reset(): void {
    this.motionTypeProperty.reset();
    this.updateModeProperty.reset();
    this.recordingProperty.reset();
    this.isPlayingProperty.reset();
    this.timeProperty.reset();
    this.furthestRecordedTimeProperty.reset();
    this.showVelocityProperty.reset();
    this.showAccelerationProperty.reset();
    this.traceModeProperty.reset();

    this.time = 0;
    this.timeAccumulator = 0;
    this.clearHistory();
    this.resetSamplingMotionModel();
    this.penPoint = new Vector2(0, 0);
    this.stopSampling();
    this.ladybug.reset();
    this.mover.reset();
  }
}
