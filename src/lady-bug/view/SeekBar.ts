/**
 * SeekBar.ts
 *
 * A timeline scrubber for the recorded motion. The filled "progress" region shows how
 * much has been recorded; the handle shows (and, when paused or in playback, sets) the
 * current playback time.
 */

import { DragListener, Node, Rectangle } from "scenerystack/scenery";
import LadyBugColors from "../../LadyBugColors.js";
import type { LadyBugModel } from "../model/LadyBugModel.js";

const BAR_HEIGHT = 10;

export default class SeekBar extends Node {
  public constructor(model: LadyBugModel, width: number) {
    super();

    const track = new Rectangle(0, 0, width, BAR_HEIGHT, {
      fill: LadyBugColors.seekBarTrackProperty,
      cornerRadius: BAR_HEIGHT / 2,
    });
    const progress = new Rectangle(0, 0, width, BAR_HEIGHT, {
      fill: LadyBugColors.seekBarProgressProperty,
      cornerRadius: BAR_HEIGHT / 2,
    });
    const handle = new Rectangle(-6, -5, 12, BAR_HEIGHT + 10, {
      fill: LadyBugColors.seekBarHandleProperty,
      stroke: "rgba(0,0,0,0.4)",
      cornerRadius: 3,
      cursor: "pointer",
    });
    this.children = [track, progress, handle];

    const maxTime = (): number => Math.max(model.furthestRecordedTimeProperty.value, model.maxRecordingTime);
    const scrubbable = (): boolean => !(model.isPlayingProperty.value && model.recordingProperty.value);

    const updateProgress = (): void => {
      const furthest = model.furthestRecordedTimeProperty.value;
      const w = (furthest / maxTime()) * width;
      progress.rectWidth = Math.max(0, w);
      progress.visible = w > 0;
    };

    const updateHandle = (): void => {
      const furthest = model.furthestRecordedTimeProperty.value;
      const percent = furthest > 0 ? Math.min(1, model.timeProperty.value / furthest) : 0;
      handle.centerX = percent * width;
      handle.centerY = BAR_HEIGHT / 2;
    };

    const updateVisibility = (): void => {
      handle.visible = scrubbable();
    };

    model.furthestRecordedTimeProperty.link(() => {
      updateProgress();
      updateHandle();
    });
    model.timeProperty.link(updateHandle);
    model.isPlayingProperty.link(updateVisibility);
    model.recordingProperty.link(updateVisibility);

    const seekToLocalX = (localX: number): void => {
      if (!scrubbable()) {
        return;
      }
      const progressWidth = (model.furthestRecordedTimeProperty.value / maxTime()) * width;
      const x = Math.max(0, Math.min(progressWidth, localX));
      model.setTime((x / width) * maxTime());
    };

    handle.addInputListener(
      new DragListener({
        drag: (event) => seekToLocalX(this.globalToLocalPoint(event.pointer.point).x),
      }),
    );
    track.addInputListener(
      new DragListener({
        press: (event) => seekToLocalX(this.globalToLocalPoint(event.pointer.point).x),
        drag: (event) => seekToLocalX(this.globalToLocalPoint(event.pointer.point).x),
      }),
    );
  }
}
