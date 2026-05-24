/**
 * MotionType.ts
 *
 * The automated motion presets (plus Manual, i.e. user-driven).
 */

export const MotionType = {
  MANUAL: "Manual",
  LINEAR: "Linear",
  CIRCULAR: "Circular",
  ELLIPTICAL: "Elliptical",
} as const;

export type MotionType = (typeof MotionType)[keyof typeof MotionType];

export const MOTION_TYPE_VALUES: MotionType[] = [
  MotionType.MANUAL,
  MotionType.LINEAR,
  MotionType.CIRCULAR,
  MotionType.ELLIPTICAL,
];
