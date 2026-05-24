/**
 * LadybugStateRecord.ts
 *
 * A snapshot of the ladybug's state at a point in time, used for record/playback.
 */

import { Vector2 } from "scenerystack/dot";
import type Ladybug from "./Ladybug.js";

export default class LadybugStateRecord {
  public time = 0;
  public position = new Vector2(0, 0);
  public velocity = new Vector2(0, 0);
  public acceleration = new Vector2(0, 0);
  public angle = 0;

  public record(time: number, ladybug: Ladybug): void {
    this.time = time;
    this.position = ladybug.position;
    this.velocity = ladybug.velocity;
    this.acceleration = ladybug.acceleration;
    this.angle = ladybug.angleProperty.value;
  }

  public apply(ladybug: Ladybug): void {
    ladybug.setPosition(this.position);
    ladybug.setVelocity(this.velocity);
    ladybug.setAcceleration(this.acceleration);
    ladybug.setAngle(this.angle);
  }
}
