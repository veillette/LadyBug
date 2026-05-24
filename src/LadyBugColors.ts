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

  // Motion vectors — same hue on both themes (matches the original sim).
  positionVectorProperty: profileColor("positionVector", "#2575BA", "#2575BA"),
  velocityVectorProperty: profileColor("velocityVector", "#CD2520", "#CD2520"),
  accelerationVectorProperty: profileColor("accelerationVector", "#349E34", "#349E34"),

  // The ladybug itself.
  ladybugBodyProperty: profileColor("ladybugBody", "#D8262B", "#C81E22"),
  ladybugSpotsProperty: profileColor("ladybugSpots", BLACK, BLACK),
  ladybugHeadProperty: profileColor("ladybugHead", new Color(20, 20, 20), BLACK),
  ladybugWingSeamProperty: profileColor("ladybugWingSeam", BLACK, BLACK),
  ladybugAntennaeProperty: profileColor("ladybugAntennae", BLACK, BLACK),

  // The motion trace — flips with the theme so it stays visible on the background.
  traceProperty: profileColor("trace", WHITE, BLACK),

  // Remote-control pad.
  remotePadFillProperty: profileColor("remotePadFill", "rgba(255, 255, 255, 0.5)", "rgba(255, 255, 255, 0.65)"),
  remoteTabFillProperty: profileColor("remoteTabFill", "rgba(255, 255, 255, 0.2)", "rgba(0, 0, 0, 0.12)"),

  // Seek bar / playback timeline.
  seekBarTrackProperty: profileColor("seekBarTrack", new Color(70, 70, 70), new Color(200, 200, 200)),
  seekBarProgressProperty: profileColor("seekBarProgress", "#2575BA", "#2575BA"),
  seekBarHandleProperty: profileColor("seekBarHandle", WHITE, new Color(80, 80, 80)),
};

ladyBug.register("LadyBugColors", LadyBugColors);

export default LadyBugColors;
