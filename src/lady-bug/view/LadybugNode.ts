/**
 * LadybugNode.ts
 *
 * The ladybug, drawn with vector shapes (themeable via LadyBugColors). Shows closed
 * or open wings depending on speed, points in its direction of motion, and can be
 * dragged to steer the simulation.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Circle, DragListener, Line, Node, Path } from "scenerystack/scenery";
import LadyBugColors from "../../LadyBugColors.js";
import LadyBugConstants from "../model/LadyBugConstants.js";
import type { LadyBugModel } from "../model/LadyBugModel.js";
import { MotionType } from "../model/MotionType.js";
import { UpdateMode } from "../model/UpdateMode.js";

// Spot centers (cm) for one side of the body; mirrored to the other side.
const SPOT_POSITIONS: ReadonlyArray<readonly [number, number]> = [
  [0.09, -0.05],
  [0.11, 0.1],
  [0.06, 0.22],
];

export default class LadybugNode extends Node {
  public constructor(model: LadyBugModel, modelViewTransform: ModelViewTransform2) {
    super({ cursor: "pointer" });

    const ladybug = model.ladybug;

    // The bug is drawn in model (cm) units pointing "up" (toward -y), then scaled to view
    // pixels and rotated to its heading. +y is down (the non-inverted model-view transform).
    const bug = new Node();
    bug.setScaleMagnitude(modelViewTransform.modelToViewDeltaX(1));
    this.addChild(bug);

    const closedWings = LadybugNode.createClosedWings();
    const openWings = LadybugNode.createOpenWings();
    const head = LadybugNode.createHead();
    const antennae = LadybugNode.createAntennae();
    bug.children = [closedWings, openWings, head, antennae];

    ladybug.positionProperty.link((position) => {
      this.translation = modelViewTransform.modelToViewPosition(position);
    });
    ladybug.angleProperty.link((angle) => {
      bug.rotation = angle + Math.PI / 2;
    });
    ladybug.velocityProperty.link((velocity) => {
      const open = velocity.magnitude >= LadyBugConstants.WING_OPEN_VELOCITY;
      openWings.visible = open;
      closedWings.visible = !open;
    });

    this.addInputListener(
      new DragListener({
        start: () => {
          model.startSampling();
          if (!model.recordingProperty.value) {
            model.recordingProperty.value = true;
          }
          if (!model.isPlayingProperty.value) {
            model.play();
          }
          model.motionTypeProperty.value = MotionType.MANUAL;
          model.updateModeProperty.value = UpdateMode.POSITION;
        },
        drag: (event) => {
          const viewPoint = this.globalToParentPoint(event.pointer.point);
          model.setSamplePoint(modelViewTransform.viewToModelPosition(viewPoint));
        },
        end: () => {
          model.stopSampling();
        },
      }),
    );
  }

  private static ellipse(cx: number, cy: number, rx: number, ry: number, fill: Path["fill"]): Path {
    return new Path(Shape.ellipse(cx, cy, rx, ry, 0), { fill });
  }

  private static createClosedWings(): Node {
    const node = new Node();
    node.addChild(LadybugNode.ellipse(0, 0, 0.2, 0.3, LadyBugColors.ladybugBodyProperty));
    node.addChild(new Line(0, -0.12, 0, 0.3, { stroke: LadyBugColors.ladybugWingSeamProperty, lineWidth: 0.03 }));
    for (const [x, y] of SPOT_POSITIONS) {
      node.addChild(new Circle(0.05, { fill: LadyBugColors.ladybugSpotsProperty, x, y }));
      node.addChild(new Circle(0.05, { fill: LadyBugColors.ladybugSpotsProperty, x: -x, y }));
    }
    return node;
  }

  private static createOpenWings(): Node {
    const node = new Node({ visible: false });
    // The exposed back, revealed between the spread wings.
    node.addChild(LadybugNode.ellipse(0, 0.02, 0.18, 0.3, LadyBugColors.ladybugHeadProperty));

    const leftWing = LadybugNode.ellipse(0, 0, 0.15, 0.28, LadyBugColors.ladybugBodyProperty);
    leftWing.rotation = 0.32;
    leftWing.translation = leftWing.translation.plusXY(-0.11, 0.02);
    const rightWing = LadybugNode.ellipse(0, 0, 0.15, 0.28, LadyBugColors.ladybugBodyProperty);
    rightWing.rotation = -0.32;
    rightWing.translation = rightWing.translation.plusXY(0.11, 0.02);

    for (const [x, y] of SPOT_POSITIONS) {
      leftWing.addChild(new Circle(0.045, { fill: LadyBugColors.ladybugSpotsProperty, x: -Math.abs(x) * 0.5, y }));
      rightWing.addChild(new Circle(0.045, { fill: LadyBugColors.ladybugSpotsProperty, x: Math.abs(x) * 0.5, y }));
    }
    node.addChild(leftWing);
    node.addChild(rightWing);
    return node;
  }

  private static createHead(): Node {
    return LadybugNode.ellipse(0, -0.27, 0.16, 0.13, LadyBugColors.ladybugHeadProperty);
  }

  private static createAntennae(): Node {
    const node = new Node();
    const stroke = LadyBugColors.ladybugAntennaeProperty;
    node.addChild(new Line(-0.05, -0.34, -0.14, -0.5, { stroke, lineWidth: 0.025 }));
    node.addChild(new Line(0.05, -0.34, 0.14, -0.5, { stroke, lineWidth: 0.025 }));
    node.addChild(new Circle(0.035, { fill: stroke, x: -0.14, y: -0.5 }));
    node.addChild(new Circle(0.035, { fill: stroke, x: 0.14, y: -0.5 }));
    return node;
  }
}
