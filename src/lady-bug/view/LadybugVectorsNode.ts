/**
 * LadybugVectorsNode.ts
 *
 * The velocity and acceleration arrows, anchored at the ladybug and scaled by the
 * model-view transform. Kept separate from LadybugNode so they don't inherit the
 * ladybug's rotation.
 */

import { Multilink } from "scenerystack/axon";
import type { Vector2 } from "scenerystack/dot";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Node } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import LadyBugColors from "../../LadyBugColors.js";
import type { LadyBugModel } from "../model/LadyBugModel.js";

// Pixel dimensions shared by all vector arrows (velocity and acceleration).
// headWidth/headHeight control the arrowhead size; tailWidth controls the shaft.
// stroke: null removes the outline so fill colour reads cleanly at any scale.
const ARROW_HEAD_WIDTH = 14; // px
const ARROW_HEAD_HEIGHT = 14; // px
const ARROW_TAIL_WIDTH = 5; // px
const ARROW_OPTIONS = {
  headWidth: ARROW_HEAD_WIDTH,
  headHeight: ARROW_HEAD_HEIGHT,
  tailWidth: ARROW_TAIL_WIDTH,
  stroke: null,
} as const;

export default class LadybugVectorsNode extends Node {
  public constructor(model: LadyBugModel, modelViewTransform: ModelViewTransform2) {
    super();

    const ladybug = model.ladybug;

    const velocityArrow = new ArrowNode(0, 0, 0, 0, {
      ...ARROW_OPTIONS,
      fill: LadyBugColors.velocityVectorProperty,
      visibleProperty: model.showVelocityProperty,
    });
    const accelerationArrow = new ArrowNode(0, 0, 0, 0, {
      ...ARROW_OPTIONS,
      fill: LadyBugColors.accelerationVectorProperty,
      visibleProperty: model.showAccelerationProperty,
    });
    this.children = [velocityArrow, accelerationArrow];

    const updateArrow = (arrow: ArrowNode, position: Vector2, vector: Vector2): void => {
      const tail = modelViewTransform.modelToViewPosition(position);
      const tip = tail.plus(modelViewTransform.modelToViewDelta(vector));
      arrow.setTailAndTip(tail.x, tail.y, tip.x, tip.y);
    };

    Multilink.multilink([ladybug.positionProperty, ladybug.velocityProperty], (position, velocity) => {
      updateArrow(velocityArrow, position, velocity);
    });
    Multilink.multilink([ladybug.positionProperty, ladybug.accelerationProperty], (position, acceleration) => {
      updateArrow(accelerationArrow, position, acceleration);
    });
  }
}
