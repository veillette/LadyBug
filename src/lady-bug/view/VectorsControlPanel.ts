/**
 * VectorsControlPanel.ts
 *
 * The right-hand control panel: vector visibility checkboxes, motion-preset radio
 * buttons, and trace-mode radio buttons. All labels come from StringManager and all
 * colors from LadyBugColors.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { type Node, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup, Panel, VerticalCheckboxGroup } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import LadyBugColors from "../../LadyBugColors.js";
import type { LadyBugModel, TraceMode } from "../model/LadyBugModel.js";
import { MotionType } from "../model/MotionType.js";

const TITLE_FONT = new PhetFont({ size: 16, weight: "bold" });
const LABEL_FONT = new PhetFont(14);

function titleText(stringProperty: TReadOnlyProperty<string>): Node {
  return new Text(stringProperty, { font: TITLE_FONT, fill: LadyBugColors.foregroundColorProperty });
}

function labelText(stringProperty: TReadOnlyProperty<string>): Node {
  return new Text(stringProperty, { font: LABEL_FONT, fill: LadyBugColors.foregroundColorProperty });
}

export default class VectorsControlPanel extends Panel {
  public constructor(model: LadyBugModel) {
    const strings = StringManager.getInstance();
    const vectors = strings.getVectorsStrings();
    const motion = strings.getMotionStrings();
    const trace = strings.getTraceStrings();

    const checkboxGroup = new VerticalCheckboxGroup(
      [
        { property: model.showVelocityProperty, createNode: () => labelText(vectors.showVelocityStringProperty) },
        {
          property: model.showAccelerationProperty,
          createNode: () => labelText(vectors.showAccelerationStringProperty),
        },
      ],
      {
        spacing: 8,
        checkboxOptions: {
          checkboxColor: LadyBugColors.foregroundColorProperty,
          checkboxColorBackground: LadyBugColors.backgroundColorProperty,
        },
      },
    );

    const radioButtonOptions = { radius: 8, stroke: LadyBugColors.foregroundColorProperty };

    const motionRadioGroup = new AquaRadioButtonGroup(
      model.motionTypeProperty,
      [
        { value: MotionType.MANUAL, createNode: () => labelText(motion.manualStringProperty) },
        { value: MotionType.LINEAR, createNode: () => labelText(motion.linearStringProperty) },
        { value: MotionType.CIRCULAR, createNode: () => labelText(motion.circularStringProperty) },
        { value: MotionType.ELLIPTICAL, createNode: () => labelText(motion.ellipticalStringProperty) },
      ],
      { spacing: 6, radioButtonOptions },
    );

    const traceRadioGroup = new AquaRadioButtonGroup<TraceMode>(
      model.traceModeProperty,
      [
        { value: "line", createNode: () => labelText(trace.lineStringProperty) },
        { value: "dots", createNode: () => labelText(trace.dotsStringProperty) },
        { value: "off", createNode: () => labelText(trace.offStringProperty) },
      ],
      { spacing: 6, radioButtonOptions },
    );

    const content = new VBox({
      align: "left",
      spacing: 8,
      children: [
        titleText(vectors.titleStringProperty),
        checkboxGroup,
        titleText(motion.titleStringProperty),
        motionRadioGroup,
        titleText(trace.titleStringProperty),
        traceRadioGroup,
      ],
    });

    super(content, {
      fill: LadyBugColors.panelFillProperty,
      stroke: LadyBugColors.panelStrokeProperty,
      cornerRadius: 6,
      xMargin: 12,
      yMargin: 10,
      align: "left",
    });
  }
}
