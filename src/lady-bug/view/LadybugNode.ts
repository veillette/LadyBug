/**
 * LadybugNode.ts
 *
 * The ladybug, drawn with vector shapes (themeable via LadyBugColors). Shows closed
 * or open wings depending on speed, points in its direction of motion, and can be
 * dragged to steer the simulation.
 *
 * All geometry constants below are in model (cm) units. The node is scaled to view
 * pixels by the model-view transform and then rotated to the ladybug's heading angle.
 */

import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Circle, DragListener, Line, Node, Path } from "scenerystack/scenery";
import LadyBugColors from "../../LadyBugColors.js";
import LadyBugConstants from "../model/LadyBugConstants.js";
import type { LadyBugModel } from "../model/LadyBugModel.js";
import { MotionType } from "../model/MotionType.js";
import { UpdateMode } from "../model/UpdateMode.js";

// Spot centres (cm) on one side of the body; mirrored to the other side.
const SPOT_POSITIONS: ReadonlyArray<readonly [number, number]> = [
  [0.09, -0.05],
  [0.11, 0.1],
  [0.06, 0.22],
];

// ── Closed-wing geometry ──────────────────────────────────────────────────────

// Half-width and half-height (cm) of the body ellipse when wings are closed.
const BODY_RX = 0.2;
const BODY_RY = 0.3;

// Y-coordinates (cm) of the top and bottom of the wing-seam dividing line.
const WING_SEAM_TOP_Y = -0.12;
const WING_SEAM_BOTTOM_Y = 0.3; // matches BODY_RY so seam spans the full body

// Stroke width (cm) of the wing-seam centre line.
const WING_SEAM_STROKE_WIDTH = 0.03;

// Radius (cm) of the spots on the closed body.
const CLOSED_SPOT_RADIUS = 0.05;

// ── Open-wing geometry ────────────────────────────────────────────────────────

// Y-offset (cm) of the exposed back ellipse when wings are open
// (shifted slightly downward to reveal the abdomen between the wings).
const BACK_OFFSET_Y = 0.02;

// Half-width and half-height (cm) of the exposed-back ellipse visible between open wings.
const BACK_RX = 0.18;
const BACK_RY = 0.3;

// Half-width and half-height (cm) of each open wing ellipse.
const OPEN_WING_RX = 0.15;
const OPEN_WING_RY = 0.28;

// Rotation angle (radians, ≈ 18.3°) each wing is tilted away from the body centreline.
const WING_ROTATION = 0.32;

// Horizontal and vertical offset (cm) applied after rotation to spread each wing.
const WING_OFFSET_X = 0.11;
const WING_OFFSET_Y = 0.02;

// Radius (cm) of the spots painted on each open wing.
const OPEN_SPOT_RADIUS = 0.045;

// Fraction of the SPOT_POSITIONS x-coordinate used to position spots on the open wings,
// accounting for the wings being rotated and translated away from the body centre.
const OPEN_SPOT_X_SCALE = 0.5;

// ── Head geometry ─────────────────────────────────────────────────────────────

// Centre Y-coordinate (cm) of the head ellipse (negative → above the body).
const HEAD_CY = -0.27;

// Half-width and half-height (cm) of the head ellipse.
const HEAD_RX = 0.16;
const HEAD_RY = 0.13;

// ── Antennae geometry ─────────────────────────────────────────────────────────

// X and Y coordinates (cm) where each antenna meets the head.
const ANTENNA_BASE_X = 0.05;
const ANTENNA_BASE_Y = -0.34;

// X and Y coordinates (cm) of the tip of each antenna.
const ANTENNA_TIP_X = 0.14;
const ANTENNA_TIP_Y = -0.5;

// Stroke width (cm) of the antenna lines.
const ANTENNA_STROKE_WIDTH = 0.025;

// Radius (cm) of the small ball at the tip of each antenna.
const ANTENNA_TIP_RADIUS = 0.035;

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
      // +π/2 rotates the bug so that its "up" direction (−y in model) aligns
      // with the positive-x world axis before the heading rotation is applied.
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
    node.addChild(LadybugNode.ellipse(0, 0, BODY_RX, BODY_RY, LadyBugColors.ladybugBodyProperty));
    node.addChild(
      new Line(0, WING_SEAM_TOP_Y, 0, WING_SEAM_BOTTOM_Y, {
        stroke: LadyBugColors.ladybugWingSeamProperty,
        lineWidth: WING_SEAM_STROKE_WIDTH,
      }),
    );
    for (const [x, y] of SPOT_POSITIONS) {
      node.addChild(new Circle(CLOSED_SPOT_RADIUS, { fill: LadyBugColors.ladybugSpotsProperty, x, y }));
      node.addChild(new Circle(CLOSED_SPOT_RADIUS, { fill: LadyBugColors.ladybugSpotsProperty, x: -x, y }));
    }
    return node;
  }

  private static createOpenWings(): Node {
    const node = new Node({ visible: false });
    // The exposed back, revealed between the spread wings.
    node.addChild(LadybugNode.ellipse(0, BACK_OFFSET_Y, BACK_RX, BACK_RY, LadyBugColors.ladybugHeadProperty));

    const leftWing = LadybugNode.ellipse(0, 0, OPEN_WING_RX, OPEN_WING_RY, LadyBugColors.ladybugBodyProperty);
    leftWing.rotation = WING_ROTATION;
    leftWing.translation = leftWing.translation.plusXY(-WING_OFFSET_X, WING_OFFSET_Y);
    const rightWing = LadybugNode.ellipse(0, 0, OPEN_WING_RX, OPEN_WING_RY, LadyBugColors.ladybugBodyProperty);
    rightWing.rotation = -WING_ROTATION;
    rightWing.translation = rightWing.translation.plusXY(WING_OFFSET_X, WING_OFFSET_Y);

    for (const [x, y] of SPOT_POSITIONS) {
      leftWing.addChild(
        new Circle(OPEN_SPOT_RADIUS, {
          fill: LadyBugColors.ladybugSpotsProperty,
          x: -Math.abs(x) * OPEN_SPOT_X_SCALE,
          y,
        }),
      );
      rightWing.addChild(
        new Circle(OPEN_SPOT_RADIUS, {
          fill: LadyBugColors.ladybugSpotsProperty,
          x: Math.abs(x) * OPEN_SPOT_X_SCALE,
          y,
        }),
      );
    }
    node.addChild(leftWing);
    node.addChild(rightWing);
    return node;
  }

  private static createHead(): Node {
    return LadybugNode.ellipse(0, HEAD_CY, HEAD_RX, HEAD_RY, LadyBugColors.ladybugHeadProperty);
  }

  private static createAntennae(): Node {
    const node = new Node();
    const stroke = LadyBugColors.ladybugAntennaeProperty;
    node.addChild(
      new Line(-ANTENNA_BASE_X, ANTENNA_BASE_Y, -ANTENNA_TIP_X, ANTENNA_TIP_Y, {
        stroke,
        lineWidth: ANTENNA_STROKE_WIDTH,
      }),
    );
    node.addChild(
      new Line(ANTENNA_BASE_X, ANTENNA_BASE_Y, ANTENNA_TIP_X, ANTENNA_TIP_Y, {
        stroke,
        lineWidth: ANTENNA_STROKE_WIDTH,
      }),
    );
    node.addChild(new Circle(ANTENNA_TIP_RADIUS, { fill: stroke, x: -ANTENNA_TIP_X, y: ANTENNA_TIP_Y }));
    node.addChild(new Circle(ANTENNA_TIP_RADIUS, { fill: stroke, x: ANTENNA_TIP_X, y: ANTENNA_TIP_Y }));
    return node;
  }
}
