/**
 * main.ts
 *
 * Entry point for the LadyBug application. Initializes the simulation,
 * creates the screen, and starts the main event loop.
 */

// NOTE: brand.js needs to be the first import. SceneryStack sims require a specific load order:
// init.ts => assert.ts => splash.ts => brand.ts => everything else (here).
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "./i18n/StringManager.js";
import LadyBugColors from "./LadyBugColors.js";
import ladyBug from "./LadyBugNamespace.js";
import { LadyBugScreen } from "./lady-bug/LadyBugScreen.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();

  const screens = [
    new LadyBugScreen({
      name: stringManager.getScreenNames().ladyBugStringProperty,
      tandem: Tandem.ROOT.createTandem("ladyBugScreen"),
      backgroundColorProperty: LadyBugColors.backgroundColorProperty,
    }),
  ];

  const simOptions = {
    preferencesModel: new PreferencesModel({
      visualOptions: {
        supportsProjectorMode: true,
        supportsInteractiveHighlights: true,
      },
      localizationOptions: {
        supportsDynamicLocale: true,
      },
    }),
  };

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, simOptions);
  ladyBug.register("sim", sim);
  sim.start();
});
