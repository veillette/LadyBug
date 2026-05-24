/**
 * PlaybackControls.ts
 *
 * Record/Playback toggle, rewind / play-pause / step transport buttons, and a Clear
 * button. (Reset All lives in the screen view.)
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { HBox, type Node, Text } from "scenerystack/scenery";
import { PhetFont, PlayPauseButton, StepBackwardButton, StepForwardButton } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup, TextPushButton } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import LadyBugColors from "../../LadyBugColors.js";
import type { LadyBugModel } from "../model/LadyBugModel.js";

const LABEL_FONT = new PhetFont(14);

function labelText(stringProperty: TReadOnlyProperty<string>): Node {
  return new Text(stringProperty, { font: LABEL_FONT, fill: LadyBugColors.foregroundColorProperty });
}

export default class PlaybackControls extends HBox {
  public constructor(model: LadyBugModel) {
    const playback = StringManager.getInstance().getPlaybackStrings();

    const recordPlaybackGroup = new AquaRadioButtonGroup<boolean>(
      model.recordingProperty,
      [
        { value: true, createNode: () => labelText(playback.recordStringProperty) },
        { value: false, createNode: () => labelText(playback.playbackStringProperty) },
      ],
      {
        orientation: "horizontal",
        spacing: 12,
        radioButtonOptions: { radius: 8, stroke: LadyBugColors.foregroundColorProperty },
      },
    );

    const rewindButton = new StepBackwardButton({
      radius: 18,
      listener: () => model.rewind(),
    });

    const playPauseButton = new PlayPauseButton(model.isPlayingProperty, { radius: 22 });

    const stepForwardButton = new StepForwardButton({
      radius: 18,
      enabledProperty: DerivedProperty.not(model.isPlayingProperty),
      listener: () => model.stepOnce(),
    });

    const clearButton = new TextPushButton(playback.clearStringProperty, {
      font: LABEL_FONT,
      listener: () => model.clear(),
    });

    super({
      spacing: 16,
      align: "center",
      children: [recordPlaybackGroup, rewindButton, playPauseButton, stepForwardButton, clearButton],
    });
  }
}
