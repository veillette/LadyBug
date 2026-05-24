/**
 * RemoteControlPanel.ts
 *
 * Lets the user steer the ladybug indirectly by dragging an arrow inside a square pad.
 * A Position / Velocity / Acceleration selector picks which quantity the arrow controls
 * (and reflects, when the user isn't dragging).
 */

import { Multilink, Property } from "scenerystack/axon";
import { Bounds2, clamp, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Circle, DragListener, Node, Rectangle, Text, VBox } from "scenerystack/scenery";
import { ArrowNode, PhetFont } from "scenerystack/scenery-phet";
import { Panel, RectangularRadioButtonGroup } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import LadyBugColors from "../../LadyBugColors.js";
import LadyBugConstants from "../model/LadyBugConstants.js";
import type { LadyBugModel } from "../model/LadyBugModel.js";
import { MotionType } from "../model/MotionType.js";
import { UpdateMode } from "../model/UpdateMode.js";

const AREA = LadyBugConstants.REMOTE_PAD_SIZE;
const HALF = AREA / 2;

const COLOR_BY_MODE = {
  [UpdateMode.POSITION]: LadyBugColors.positionVectorProperty,
  [UpdateMode.VELOCITY]: LadyBugColors.velocityVectorProperty,
  [UpdateMode.ACCELERATION]: LadyBugColors.accelerationVectorProperty,
};

export default class RemoteControlPanel extends Panel {
  private readonly selectedModeProperty: Property<UpdateMode>;

  public constructor(model: LadyBugModel) {
    const strings = StringManager.getInstance();
    const remote = strings.getRemoteControlStrings();
    const selectedModeProperty = new Property<UpdateMode>(UpdateMode.POSITION);

    const titleFont = new PhetFont({ size: 16, weight: "bold" });
    const tabFont = new PhetFont(13);

    const header = new Text(remote.titleStringProperty, {
      font: titleFont,
      fill: LadyBugColors.foregroundColorProperty,
    });

    const tabs = new RectangularRadioButtonGroup<UpdateMode>(
      selectedModeProperty,
      [
        {
          value: UpdateMode.POSITION,
          createNode: () => new Text(remote.positionStringProperty, { font: tabFont, fill: COLOR_BY_MODE.position }),
        },
        {
          value: UpdateMode.VELOCITY,
          createNode: () => new Text(remote.velocityStringProperty, { font: tabFont, fill: COLOR_BY_MODE.velocity }),
        },
        {
          value: UpdateMode.ACCELERATION,
          createNode: () =>
            new Text(remote.accelerationStringProperty, { font: tabFont, fill: COLOR_BY_MODE.acceleration }),
        },
      ],
      { orientation: "horizontal", spacing: 4 },
    );

    const padBackground = new Rectangle(-HALF, -HALF, AREA, AREA, {
      fill: LadyBugColors.remotePadFillProperty,
      cornerRadius: 4,
    });
    const arrow = new ArrowNode(0, 0, 0, 0, { headWidth: 14, headHeight: 14, tailWidth: 5, stroke: null });
    const knob = new Circle(9, { cursor: "pointer", stroke: "rgba(0,0,0,0.4)" });
    const padLayer = new Node({
      clipArea: Shape.bounds(new Bounds2(-HALF, -HALF, HALF, HALF)),
      children: [arrow, knob],
    });
    const pad = new Node({ children: [padBackground, padLayer] });

    const content = new VBox({ spacing: 8, children: [header, tabs, pad] });
    super(content, {
      fill: LadyBugColors.panelFillProperty,
      stroke: LadyBugColors.panelStrokeProperty,
      cornerRadius: 6,
      xMargin: 12,
      yMargin: 10,
    });

    this.selectedModeProperty = selectedModeProperty;

    let isDragging = false;

    const setTip = (tip: Vector2): void => {
      arrow.setTailAndTip(0, 0, tip.x, tip.y);
      knob.center = tip;
    };

    // Model → arrow (when the user isn't dragging).
    const reflect = (): void => {
      if (isDragging) {
        return;
      }
      const ladybug = model.ladybug;
      let tip: Vector2;
      if (selectedModeProperty.value === UpdateMode.POSITION) {
        const bounds = model.getBounds();
        tip = new Vector2((ladybug.position.x / bounds.width) * AREA, (ladybug.position.y / bounds.height) * AREA);
      } else if (selectedModeProperty.value === UpdateMode.VELOCITY) {
        tip = ladybug.velocity.timesScalar(AREA);
      } else {
        tip = ladybug.acceleration.timesScalar(AREA);
      }
      setTip(new Vector2(clamp(tip.x, -HALF, HALF), clamp(tip.y, -HALF, HALF)));
    };

    // Arrow → model.
    const apply = (tip: Vector2): void => {
      const ladybug = model.ladybug;
      if (selectedModeProperty.value === UpdateMode.POSITION) {
        const bounds = model.getBounds();
        const minDim = Math.min(bounds.width, bounds.height);
        model.setSamplePoint(new Vector2((tip.x / AREA) * minDim, (tip.y / AREA) * minDim));
      } else if (selectedModeProperty.value === UpdateMode.VELOCITY) {
        ladybug.setVelocityXY(tip.x / AREA, tip.y / AREA);
      } else {
        ladybug.setAccelerationXY(tip.x / AREA, tip.y / AREA);
      }
    };

    knob.addInputListener(
      new DragListener({
        start: () => {
          isDragging = true;
          model.recordingProperty.value = true;
          model.motionTypeProperty.value = MotionType.MANUAL;
          model.updateModeProperty.value = selectedModeProperty.value;
          model.play();
          if (selectedModeProperty.value === UpdateMode.POSITION) {
            model.startSampling();
          }
        },
        drag: (event) => {
          const local = padLayer.globalToLocalPoint(event.pointer.point);
          const tip = new Vector2(clamp(local.x, -HALF, HALF), clamp(local.y, -HALF, HALF));
          setTip(tip);
          apply(tip);
        },
        end: () => {
          if (selectedModeProperty.value === UpdateMode.POSITION) {
            model.stopSampling();
          }
          isDragging = false;
        },
      }),
    );

    const applyArrowColor = (): void => {
      const color = COLOR_BY_MODE[selectedModeProperty.value];
      arrow.fill = color;
      knob.fill = color;
    };
    selectedModeProperty.link(applyArrowColor);

    Multilink.multilink(
      [
        model.ladybug.positionProperty,
        model.ladybug.velocityProperty,
        model.ladybug.accelerationProperty,
        selectedModeProperty,
      ],
      reflect,
    );
  }

  public reset(): void {
    this.selectedModeProperty.reset();
  }
}
