import { Screen, type ScreenOptions } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { LadyBugModel } from "./model/LadyBugModel.js";
import { LadyBugScreenView } from "./view/LadyBugScreenView.js";

type LadyBugScreenOptions = ScreenOptions & { tandem: Tandem };

export class LadyBugScreen extends Screen<LadyBugModel, LadyBugScreenView> {
  public constructor(options: LadyBugScreenOptions) {
    super(
      () => new LadyBugModel(),
      (model) => new LadyBugScreenView(model, { tandem: options.tandem.createTandem("view") }),
      options,
    );
  }
}
