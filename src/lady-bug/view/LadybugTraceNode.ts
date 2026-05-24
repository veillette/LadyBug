/**
 * LadybugTraceNode.ts
 *
 * Draws the ladybug's recorded path as either a line or a series of dots, fading
 * each segment toward a low opacity over a couple of seconds. Uses a CanvasNode so
 * that each segment can be stroked with its own alpha cheaply.
 */

import type { Bounds2 } from "scenerystack/dot";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { CanvasNode } from "scenerystack/scenery";
import LadyBugColors from "../../LadyBugColors.js";
import LadyBugConstants from "../model/LadyBugConstants.js";
import type { LadyBugModel } from "../model/LadyBugModel.js";

export default class LadybugTraceNode extends CanvasNode {
  private readonly model: LadyBugModel;
  private readonly modelViewTransform: ModelViewTransform2;

  public constructor(model: LadyBugModel, modelViewTransform: ModelViewTransform2, canvasBounds: Bounds2) {
    super({ canvasBounds });
    this.model = model;
    this.modelViewTransform = modelViewTransform;

    const repaint = () => this.invalidatePaint();
    model.historyAddedEmitter.addListener(repaint);
    model.historyRemovedEmitter.addListener(repaint);
    model.timeProperty.link(repaint);
    LadyBugColors.traceProperty.link(repaint);
    model.traceModeProperty.link((mode) => {
      this.visible = mode !== "off";
      repaint();
    });
  }

  private opacityForState(time: number, stateTime: number): number {
    const age = time - stateTime;
    const oldOpacity = LadyBugConstants.TRACE_OLD_OPACITY;
    const newOpacity = LadyBugConstants.TRACE_NEW_OPACITY;
    if (age >= LadyBugConstants.TRACE_SECONDS_TO_BE_OLD) {
      return oldOpacity;
    }
    return newOpacity + (oldOpacity - newOpacity) * (age / LadyBugConstants.TRACE_SECONDS_TO_BE_OLD);
  }

  public override paintCanvas(context: CanvasRenderingContext2D): void {
    const mode = this.model.traceModeProperty.value;
    if (mode === "off") {
      return;
    }

    const history = this.model.culledStateHistory;
    if (history.length === 0) {
      return;
    }
    const time = this.model.timeProperty.value;
    const colorCss = LadyBugColors.traceProperty.value.toCSS();
    const mvt = this.modelViewTransform;

    if (mode === "dots") {
      context.fillStyle = colorCss;
      for (let i = 0; i < history.length; i += 4) {
        const state = history[i];
        if (!state) {
          continue;
        }
        const point = mvt.modelToViewPosition(state.position);
        context.globalAlpha = this.opacityForState(time, state.time);
        context.beginPath();
        context.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        context.fill();
      }
    } else {
      context.strokeStyle = colorCss;
      context.lineWidth = 3;
      context.lineCap = "round";
      for (let i = 1; i < history.length; i++) {
        const a = history[i - 1];
        const b = history[i];
        if (!(a && b)) {
          continue;
        }
        const pa = mvt.modelToViewPosition(a.position);
        const pb = mvt.modelToViewPosition(b.position);
        context.globalAlpha = this.opacityForState(time, b.time);
        context.beginPath();
        context.moveTo(pa.x, pa.y);
        context.lineTo(pb.x, pb.y);
        context.stroke();
      }
    }
    context.globalAlpha = 1;
  }
}
