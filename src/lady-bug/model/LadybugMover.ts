/**
 * LadybugMover.ts
 *
 * Drives the ladybug along an automated path (Linear / Circular / Elliptical), or
 * does nothing in Manual mode. The magic constants are calibrated for the fixed
 * model timestep (LadyBugConstants.FIXED_DT); see LadyBugConstants.
 *
 * Modeled after edu.colorado.phet.ladybugmotion2d.model.LadybugMotionModel.
 */

import { type Bounds2, Vector2 } from "scenerystack/dot";
import LadyBugConstants from "./LadyBugConstants.js";
import type Ladybug from "./Ladybug.js";
import { MotionType } from "./MotionType.js";

/** What the mover needs from the simulation model (decouples it from LadyBugModel). */
export interface MoverContext {
  readonly ladybug: Ladybug;
  getBounds(): Bounds2;
  estimateAcceleration(): Vector2;
  setSamplePoint(point: Vector2): void;
  startSampling(): void;
  stopSampling(): void;
  updatePositionMode(dt: number): void;
  clearSampleHistory(): void;
  resetSamplingMotionModel(): void;
  initManual(): void;
}

export default class LadybugMover {
  private motionType: MotionType = MotionType.MANUAL;
  private elapsedEllipticalTime = 0;
  private readonly context: MoverContext;

  public constructor(context: MoverContext) {
    this.context = context;
  }

  public setMotionType(motionType: MotionType): void {
    if (this.motionType !== motionType) {
      this.motionType = motionType;
      this.init();
    }
  }

  public isManual(): boolean {
    return this.motionType === MotionType.MANUAL;
  }

  public reset(): void {
    this.setMotionType(MotionType.MANUAL);
  }

  private init(): void {
    const { context } = this;
    const ladybug = context.ladybug;
    switch (this.motionType) {
      case MotionType.MANUAL:
        context.initManual();
        break;
      case MotionType.LINEAR:
        ladybug.setVelocity(Vector2.createPolar(LadyBugConstants.LINEAR_SPEED, ladybug.angleProperty.value));
        break;
      case MotionType.CIRCULAR:
        context.clearSampleHistory();
        context.resetSamplingMotionModel();
        break;
      case MotionType.ELLIPTICAL:
        this.elapsedEllipticalTime = 0;
        break;
    }
  }

  public update(dt: number): void {
    switch (this.motionType) {
      case MotionType.MANUAL:
        break;
      case MotionType.LINEAR:
        this.updateLinear(dt);
        break;
      case MotionType.CIRCULAR:
        this.updateCircular(dt);
        break;
      case MotionType.ELLIPTICAL:
        this.updateElliptical(dt);
        break;
    }
  }

  private updateLinear(dt: number): void {
    const { context } = this;
    const ladybug = context.ladybug;
    const speed = LadyBugConstants.LINEAR_SPEED;

    ladybug.setVelocity(Vector2.createPolar(speed, ladybug.velocity.angle));
    ladybug.updatePositionFromVelocity(dt);

    let x = ladybug.position.x;
    let y = ladybug.position.y;
    let vx = ladybug.velocity.x;
    let vy = ladybug.velocity.y;
    const bounds = context.getBounds();

    // Bounce off the scene edges.
    if (x > bounds.maxX && vx > 0) {
      vx = -Math.abs(vx);
      x = bounds.maxX;
    }
    if (x < bounds.minX && vx < 0) {
      vx = Math.abs(vx);
      x = bounds.minX;
    }
    if (y > bounds.maxY && vy > 0) {
      vy = -Math.abs(vy);
      y = bounds.maxY;
    }
    if (y < bounds.minY && vy < 0) {
      vy = Math.abs(vy);
      y = bounds.minY;
    }

    ladybug.setPositionXY(x, y);
    ladybug.setVelocityXY(vx, vy);
    ladybug.setAcceleration(context.estimateAcceleration());
    ladybug.setAngle(ladybug.velocity.angle);
    context.setSamplePoint(ladybug.position);
  }

  private updateCircular(dt: number): void {
    const { context } = this;
    const ladybug = context.ladybug;
    const position = ladybug.position;
    const distanceFromCenter = position.magnitude;
    const distanceFromRing = Math.abs(distanceFromCenter - LadyBugConstants.CIRCLE_RADIUS);
    const dx = LadyBugConstants.CIRCLE_RADIUS - distanceFromCenter;
    const speed = LadyBugConstants.CIRCLE_SPEED;

    if (distanceFromRing > speed + 1e-6) {
      // Move toward the ring.
      const velocity = new Vector2(speed, 0).rotated(position.angle).timesScalar(dx < 0 ? -1 : 1);
      context.startSampling();
      context.setSamplePoint(new Vector2(position.x + velocity.x / dt, position.y + velocity.y / dt));
      context.updatePositionMode(dt);
    } else {
      // We are on the ring; advance around it.
      const angle = position.angle;
      const r = LadyBugConstants.CIRCLE_RADIUS;
      const deltaTheta = (-Math.PI / 64) * 1.3 * dt * 30 * 0.7 * 2 * 0.85 * 0.4;
      const n = Math.floor((Math.PI * 2) / deltaTheta);
      const newAngle = angle + (2 * Math.PI) / n;

      context.stopSampling();

      ladybug.setPosition(new Vector2(1, 0).rotated(newAngle).timesScalar(r));

      const velocity = new Vector2(1, 0).rotated(newAngle + Math.PI / 2).timesScalar(((newAngle - angle) / dt) * r);
      ladybug.setVelocity(velocity);
      ladybug.setAngle(velocity.angle);

      ladybug.setAcceleration(new Vector2(1, 0).rotated(newAngle + Math.PI).timesScalar(velocity.magnitude ** 2 / r));

      context.setSamplePoint(ladybug.position);
    }
  }

  private updateElliptical(dt: number): void {
    const ladybug = this.context.ladybug;
    const a = LadyBugConstants.ELLIPSE_A;
    const b = LadyBugConstants.ELLIPSE_B;

    const n = ((79 * dt) / 0.015) * 0.7 * 5;
    this.elapsedEllipticalTime += (2 * Math.PI) / Math.floor(n);
    const t = this.elapsedEllipticalTime;

    ladybug.setPositionXY(a * Math.cos(t), b * Math.sin(t));
    ladybug.setVelocityXY(-a * Math.sin(t), b * Math.cos(t));
    ladybug.setAccelerationXY(-a * Math.cos(t), -b * Math.sin(t));
    ladybug.setAngle(ladybug.velocity.angle);
  }
}
