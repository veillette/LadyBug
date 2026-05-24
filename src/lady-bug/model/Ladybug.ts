/**
 * Ladybug.ts
 *
 * The ladybug entity: its position, velocity, acceleration, and heading angle,
 * plus simple kinematic helpers. Replaces the original Backbone MotionObject.
 */

import { NumberProperty } from "scenerystack/axon";
import { Bounds2, Vector2, Vector2Property } from "scenerystack/dot";
import LadyBugConstants from "./LadyBugConstants.js";

export default class Ladybug {
  public readonly positionProperty = new Vector2Property(new Vector2(0, 0));
  public readonly velocityProperty = new Vector2Property(new Vector2(0, 0));
  public readonly accelerationProperty = new Vector2Property(new Vector2(0, 0));
  public readonly angleProperty = new NumberProperty(0);

  public readonly width = LadyBugConstants.LADYBUG_WIDTH;
  public readonly length = LadyBugConstants.LADYBUG_LENGTH;

  public get position(): Vector2 {
    return this.positionProperty.value;
  }

  public get velocity(): Vector2 {
    return this.velocityProperty.value;
  }

  public get acceleration(): Vector2 {
    return this.accelerationProperty.value;
  }

  public setPosition(value: Vector2): void {
    this.positionProperty.value = value;
  }

  public setPositionXY(x: number, y: number): void {
    this.positionProperty.value = new Vector2(x, y);
  }

  public setVelocity(value: Vector2): void {
    this.velocityProperty.value = value;
  }

  public setVelocityXY(x: number, y: number): void {
    this.velocityProperty.value = new Vector2(x, y);
  }

  public setAcceleration(value: Vector2): void {
    this.accelerationProperty.value = value;
  }

  public setAccelerationXY(x: number, y: number): void {
    this.accelerationProperty.value = new Vector2(x, y);
  }

  public setAngle(angle: number): void {
    this.angleProperty.value = angle;
  }

  /** position += velocity * dt */
  public updatePositionFromVelocity(dt: number): void {
    this.setPosition(this.position.plus(this.velocity.timesScalar(dt)));
  }

  /** velocity += acceleration * dt */
  public updateVelocity(dt: number): void {
    this.setVelocity(this.velocity.plus(this.acceleration.timesScalar(dt)));
  }

  public getBounds(): Bounds2 {
    const p = this.position;
    return new Bounds2(p.x - this.width / 2, p.y - this.length / 2, p.x + this.width / 2, p.y + this.length / 2);
  }

  public reset(): void {
    this.setPositionXY(0, 0);
    this.setVelocityXY(0, 0);
    this.setAccelerationXY(0, 0);
    this.setAngle(0);
  }
}
