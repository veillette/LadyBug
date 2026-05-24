/**
 * UpdateMode.ts
 *
 * Which kinematic quantity the ladybug is being driven by when in manual mode.
 */

export const UpdateMode = {
  POSITION: "position",
  VELOCITY: "velocity",
  ACCELERATION: "acceleration",
} as const;

export type UpdateMode = (typeof UpdateMode)[keyof typeof UpdateMode];
