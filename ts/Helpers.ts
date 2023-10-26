import { Point, makePoint, Stats } from './DataParser';

/**
 * Function does not validate if start < stop, it's responsibility of the caller to perform
 * such check.
 *
 * @param start Lowest value (inclusive)
 * @param stop Highest value (exclusive)
 * @param pointsNumber How many number in the defined range should be returned
 */
export function sampleRange(start: number, stop: number, pointsNumber: number): number[] {
  const diff = stop - start;
  const step = diff / (pointsNumber - 1);
  return Array.from({ length : pointsNumber }, (_, v) => start + v * step);
}

export function align(reference: Stats, data: number[]): number[] {
  const dataStats = stats(data);
  const toPeak = alignToPeakIntensity(reference.peakIntensity, data, dataStats.min, dataStats.max);
  return alignToBase(toPeak, dataStats.min, reference.min);
}

export function alignPoints(reference: Stats, points: Point[]): Point[] {
  const aligned = align(reference, points.map(p => p.y));

  // https://stackoverflow.com/questions/22015684/how-do-i-zip-two-arrays-in-javascript
  return points.map((p, index) => {
    return makePoint(p.x, aligned[index]);
  });
}

export function stats(xs: number[]): Stats {
  const min = Math.min.apply(null, xs);
  const max = Math.max.apply(null, xs);
  const intensity = peakIntensity(min, max);
  return new Stats(min, max, intensity);
}

// returns factors a and b of linear function that was found
export function computeShiftFunction(summed: number[], aligned: number[]): [number, number] {
  const a = (aligned[1] - aligned[0]) / (summed[1] - summed[0]);
  const b = aligned[0] - a * summed[0];
  return [a, b];
}

// TODO: define better
function peakIntensity(min: number, max: number): number {
  return max / min;
}

function alignToPeakIntensity(desiredPeakIntensity: number, dataToAlign: number[], min: number, max: number): number[] {
  const newMax = min * desiredPeakIntensity;
  const diff = max - min;
  const newDiff = newMax - min;

  return dataToAlign.map((curr) => {
    const ratio = (curr - min) / diff;
    return min + (ratio * newDiff);
  });
}

function alignToBase(dataToAlign: number[], min: number, newMin: number): number[] {
  return dataToAlign.map((curr) => {
    return (curr / min) * newMin;
  });
}

export function arrayInWindows<T>(arr: T[], windowSize: number): T[][] {
  const res = [];
  for (const i in arr) {
    if (parseInt(i, 10) % windowSize === 0) {
      res.push([]);
    }
    res[res.length - 1].push(arr[i]);
  }
  return res;
}
