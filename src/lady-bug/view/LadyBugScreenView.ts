import { DerivedProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { TextPushButton } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../i18n/StringManager.js";
import LadyBugConstants from "../model/LadyBugConstants.js";
import type { LadyBugModel } from "../model/LadyBugModel.js";
import LadybugNode from "./LadybugNode.js";
import LadybugTraceNode from "./LadybugTraceNode.js";
import LadybugVectorsNode from "./LadybugVectorsNode.js";
import PlaybackControls from "./PlaybackControls.js";
import RemoteControlPanel from "./RemoteControlPanel.js";
import SeekBar from "./SeekBar.js";
import VectorsControlPanel from "./VectorsControlPanel.js";

type LadyBugScreenViewOptions = ScreenViewOptions & { tandem: Tandem };

const MARGIN = 12;
const BOTTOM_CONTROLS_HEIGHT = 100;

/**
 * LadyBugScreenView
 *
 * Lays out the play area (with the ladybug, its vectors, and the motion trace), the
 * right-hand control panels, and the bottom playback timeline.
 */
export class LadyBugScreenView extends ScreenView {
  private readonly remoteControlPanel: RemoteControlPanel;

  public constructor(model: LadyBugModel, providedOptions: LadyBugScreenViewOptions) {
    super(providedOptions);

    const layoutBounds = this.layoutBounds;

    // Right-hand control column.
    const vectorsControlPanel = new VectorsControlPanel(model);
    const remoteControlPanel = new RemoteControlPanel(model);
    this.remoteControlPanel = remoteControlPanel;
    const columnWidth = Math.max(vectorsControlPanel.width, remoteControlPanel.width);

    // Play area occupies the space left of the control column and above the bottom controls.
    const usableWidth = layoutBounds.width - columnWidth - 3 * MARGIN;
    const usableHeight = layoutBounds.height - BOTTOM_CONTROLS_HEIGHT - 2 * MARGIN;
    const playAreaCenterX = MARGIN + usableWidth / 2;
    const playAreaCenterY = MARGIN + usableHeight / 2;
    const scale = Math.min(usableWidth, usableHeight) / LadyBugConstants.SCENE_DIAMETER;

    // Non-inverted Y mapping (model +Y is down on screen), matching the original sim so
    // the tuned motion presets, vectors, and heading angles behave identically.
    const modelViewTransform = ModelViewTransform2.createSinglePointScaleMapping(
      Vector2.ZERO,
      new Vector2(playAreaCenterX, playAreaCenterY),
      scale,
    );

    const topLeft = modelViewTransform.viewToModelXY(
      playAreaCenterX - usableWidth / 2,
      playAreaCenterY - usableHeight / 2,
    );
    const bottomRight = modelViewTransform.viewToModelXY(
      playAreaCenterX + usableWidth / 2,
      playAreaCenterY + usableHeight / 2,
    );
    model.setBounds(topLeft.x, topLeft.y, bottomRight.x, bottomRight.y);

    const traceNode = new LadybugTraceNode(model, modelViewTransform, layoutBounds);
    const ladybugNode = new LadybugNode(model, modelViewTransform);
    const vectorsNode = new LadybugVectorsNode(model, modelViewTransform);

    const returnButton = new TextPushButton(StringManager.getInstance().getReturnLadybugStringProperty(), {
      font: new PhetFont(16),
      baseColor: "#f6e652",
      visibleProperty: new DerivedProperty([model.ladybug.positionProperty], () => model.ladybugOutOfBounds()),
      listener: () => model.returnLadybug(),
    });

    const playbackControls = new PlaybackControls(model);
    const seekBar = new SeekBar(model, usableWidth);

    const resetAllButton = new ResetAllButton({
      listener: () => {
        this.interruptSubtreeInput();
        model.reset();
        this.reset();
      },
      right: layoutBounds.maxX - MARGIN,
      bottom: layoutBounds.maxY - MARGIN,
      tandem: providedOptions.tandem.createTandem("resetAllButton"),
    });

    // Position everything.
    vectorsControlPanel.right = layoutBounds.maxX - MARGIN;
    vectorsControlPanel.top = MARGIN;
    remoteControlPanel.right = layoutBounds.maxX - MARGIN;
    remoteControlPanel.top = vectorsControlPanel.bottom + MARGIN;

    returnButton.centerX = playAreaCenterX;
    returnButton.top = MARGIN;

    seekBar.centerX = playAreaCenterX;
    seekBar.bottom = layoutBounds.maxY - BOTTOM_CONTROLS_HEIGHT + 12;
    playbackControls.centerX = playAreaCenterX;
    playbackControls.bottom = layoutBounds.maxY - MARGIN;

    this.children = [
      traceNode,
      ladybugNode,
      vectorsNode,
      returnButton,
      vectorsControlPanel,
      remoteControlPanel,
      seekBar,
      playbackControls,
      resetAllButton,
    ];
  }

  public reset(): void {
    this.remoteControlPanel.reset();
  }
}
