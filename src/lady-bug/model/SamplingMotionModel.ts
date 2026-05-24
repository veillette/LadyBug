/**
 * SamplingMotionModel.ts
 *
 * Keeps a rolling history of sampled positions and derives smoothed velocity and
 * acceleration from it. Ported from the original sim (itself modeled after PhET's
 * Motion2DModel). Pure numeric code — no observable state.
 */

import { Vector2 } from "scenerystack/dot";

class SamplingMotionModelValue {
  private avgBefore = 0;
  private avgMid = 0;
  private avgNow = 0;
  private readonly values: number[] = [];
  private readonly averages: number[] = [];
  private readonly numPoints: number;
  private readonly halfWindowSize: number;
  private readonly numPointsAveraged: number;

  public constructor(numPoints: number, halfWindowSize: number, numPointsAveraged: number, initialValue: number) {
    this.numPoints = numPoints;
    this.halfWindowSize = halfWindowSize;
    this.numPointsAveraged = numPointsAveraged;
    this.reset(initialValue);
  }

  public reset(initialValue: number): void {
    for (let i = 0; i < this.numPoints; i++) {
      this.values[i] = initialValue;
    }
  }

  public addPointAndUpdate(value: number): void {
    this.values.push(value);
    this.values.shift();

    const averagesLength = this.lengthOfAveragesArray();
    const halfWindowSize = this.halfWindowSize;
    for (let i = 0; i < averagesLength; i++) {
      let sum = 0;
      for (let j = -halfWindowSize; j <= halfWindowSize; j++) {
        sum += this.values[i + halfWindowSize + j] ?? 0;
      }
      this.averages[i] = sum / (2 * halfWindowSize + 1);
    }

    this.updateAverages();
  }

  private updateAverages(): void {
    const numPointsAveraged = this.numPointsAveraged;
    const averagesLength = this.lengthOfAveragesArray();

    let sumBefore = 0;
    for (let i = 0; i <= numPointsAveraged - 1; i++) {
      sumBefore += this.averages[i] ?? 0;
    }
    this.avgBefore = sumBefore / numPointsAveraged;

    let sumMid = 0;
    for (let i = (averagesLength - numPointsAveraged) / 2; i <= (averagesLength + numPointsAveraged - 2) / 2; i++) {
      sumMid += this.averages[i] ?? 0;
    }
    this.avgMid = sumMid / numPointsAveraged;

    let sumNow = 0;
    for (let i = averagesLength - numPointsAveraged; i <= averagesLength - 1; i++) {
      sumNow += this.averages[i] ?? 0;
    }
    this.avgNow = sumNow / numPointsAveraged;
  }

  private lengthOfAveragesArray(): number {
    return this.numPoints - 2 * this.halfWindowSize;
  }

  public getVelocity(): number {
    return this.avgNow - this.avgBefore;
  }

  public getAcceleration(): number {
    return this.avgNow - 2 * this.avgMid + this.avgBefore;
  }

  public getAverageMid(): number {
    return this.avgMid;
  }
}

export default class SamplingMotionModel {
  private readonly x: SamplingMotionModelValue;
  private readonly y: SamplingMotionModelValue;

  public constructor(halfWindowSize: number, numPointsAveraged: number, x0: number, y0: number) {
    const numPoints = 3 * numPointsAveraged + 2 * halfWindowSize;
    this.x = new SamplingMotionModelValue(numPoints, halfWindowSize, numPointsAveraged, x0);
    this.y = new SamplingMotionModelValue(numPoints, halfWindowSize, numPointsAveraged, y0);
  }

  public addPointAndUpdate(point: Vector2): void {
    this.x.addPointAndUpdate(point.x);
    this.y.addPointAndUpdate(point.y);
  }

  public getVelocity(): Vector2 {
    return new Vector2(this.x.getVelocity(), this.y.getVelocity());
  }

  public getAcceleration(): Vector2 {
    return new Vector2(this.x.getAcceleration(), this.y.getAcceleration());
  }

  public getAverageMid(): Vector2 {
    return new Vector2(this.x.getAverageMid(), this.y.getAverageMid());
  }

  public reset(point: Vector2): void {
    this.x.reset(point.x);
    this.y.reset(point.y);
  }
}
