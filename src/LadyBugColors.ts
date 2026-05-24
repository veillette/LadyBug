import { Color, ProfileColorProperty } from "scenerystack";
import ladyBug from "./LadyBugNamespace.js";

const { BLACK, WHITE } = Color;

function profileColor(name: string, def: Color | string, projector: Color | string): ProfileColorProperty {
  return new ProfileColorProperty(ladyBug, name, { default: def, projector });
}

const LadyBugColors = {
  backgroundColorProperty: profileColor("background", BLACK, WHITE),
  foregroundColorProperty: profileColor("foreground", WHITE, BLACK),
  panelFillProperty: profileColor("panelFill", new Color(40, 40, 40), new Color(240, 240, 240)),
  panelStrokeProperty: profileColor("panelStroke", "rgba(255, 255, 255, 0.4)", "rgba(0, 0, 0, 0.4)"),
};

ladyBug.register("LadyBugColors", LadyBugColors);

export default LadyBugColors;
