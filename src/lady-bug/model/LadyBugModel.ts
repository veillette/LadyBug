import type { TModel } from "scenerystack/joist";

/**
 * LadyBugModel
 *
 * Scaffold model — no simulation logic yet.
 */
export class LadyBugModel implements TModel {
  public reset(): void {
    // No state to reset yet.
  }

  public step(_dt: number): void {
    // No simulation logic yet.
  }
}
