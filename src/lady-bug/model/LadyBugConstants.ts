/**
 * LadyBugConstants.ts
 *
 * Numeric physics and layout constants, ported from the original Ladybug Motion sim.
 * Colors live in LadyBugColors; user-facing strings live in StringManager.
 */

const LadyBugConstants = {
  // The model runs on a fixed internal timestep. The original sim stepped at a fixed
  // ~33 ms (30 fps), and every motion-preset constant plus the velocity/acceleration
  // scaling factors below are calibrated around this dt. Stepping with the real (variable)
  // frame dt would make the tuned motion run at the wrong speed, so we substep instead.
  FIXED_DT: 1 / 30,
  MAX_CATCHUP_STEPS: 5,

  // Smallest scene dimension, in centimeters, used to derive the model-view scale.
  SCENE_DIAMETER: 5,

  // Number of recent samples used to estimate velocity / acceleration derivatives.
  ESTIMATION_SAMPLE_SIZE: 6,

  // Ladybug size, in centimeters.
  LADYBUG_WIDTH: 0.4,
  LADYBUG_LENGTH: 0.6,

  // Speed (cm/s) at or above which the ladybug spreads its wings.
  WING_OPEN_VELOCITY: 2,

  // Motion-preset constants (all calibrated for FIXED_DT).
  LINEAR_SPEED: 0.8, // cm/s
  CIRCLE_RADIUS: 2, // cm
  CIRCLE_SPEED: 0.018, // arbitrary tuned value
  ELLIPSE_A: 2, // cm
  ELLIPSE_B: 1.4, // cm

  // Trace opacity fade.
  TRACE_NEW_OPACITY: 1,
  TRACE_OLD_OPACITY: 0.15,
  TRACE_SECONDS_TO_BE_OLD: 2,

  // Recording / playback.
  MAX_RECORDING_TIME: 20, // seconds
  PEN_PATH_MAX: 100, // max retained pen-path samples

  // SamplingMotionModel tuning (halfWindowSize, numPointsAveraged).
  SAMPLING_HALF_WINDOW: 10,
  SAMPLING_NUM_AVERAGED: 5,

  // Remote-control pad: side length of the square drag area, in view pixels.
  REMOTE_PAD_SIZE: 166,
} as const;

export default LadyBugConstants;
