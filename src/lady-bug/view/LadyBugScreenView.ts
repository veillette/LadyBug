import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import type { LadyBugModel } from "../model/LadyBugModel.js";

type LadyBugScreenViewOptions = ScreenViewOptions & { tandem: Tandem };

/**
 * LadyBugScreenView
 *
 * Scaffold view — an empty play area with a Reset All button.
 */
export class LadyBugScreenView extends ScreenView {
  public constructor(model: LadyBugModel, providedOptions: LadyBugScreenViewOptions) {
    super(providedOptions);

    const resetAllButton = new ResetAllButton({
      listener: () => {
        this.interruptSubtreeInput();
        model.reset();
        this.reset();
      },
      right: this.layoutBounds.maxX - 10,
      bottom: this.layoutBounds.maxY - 10,
      tandem: providedOptions.tandem.createTandem("resetAllButton"),
    });
    this.addChild(resetAllButton);
  }

  public reset(): void {
    // No view state to reset yet.
  }
}
