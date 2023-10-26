import { alignPoints, arrayInWindows } from './Helpers';
import { lorentzianQuickFit, LorentzianParams } from './Lorentzian';
import { Config } from './Config';
import { Point, Stats } from './DataParser';
import * as $ from 'jquery';

const LM = require('@msitko/ml-levenberg-marquardt');

const minValues: number[] = [Config.lorWBoundary.min,
  Config.lorCensBoundary.min,
  Config.lorEpsBoundary.min,
  Config.lorBhfBoundary.min,
  Config.lorPearkIntensityBoundary.min,
];

const maxValues: number[] = [Config.lorWBoundary.max,
  Config.lorCensBoundary.max,
  Config.lorEpsBoundary.max,
  Config.lorBhfBoundary.max,
  Config.lorPearkIntensityBoundary.max,
];

const syntheticStats = new Stats(1, 800, 800);

export function quickFit(initialLorentzianParams: LorentzianParams[], data: Point[]): LorentzianParams[] {
  const data2 = alignPoints(syntheticStats, data);
  // this is flatMap in JS: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap#reduce()_and_concat()
  const initialValues = initialLorentzianParams.reduce((acc, siteParams) => acc.concat(siteParams.toArray(), []), []);
  console.log(`before initial values: ${JSON.stringify(initialValues)}`);

  const options = {
    initialValues,
    minValues: Array(initialLorentzianParams.length).fill(minValues).reduce((acc, curr) => acc.concat(curr)),
    maxValues: Array(initialLorentzianParams.length).fill(maxValues).reduce((acc, curr) => acc.concat(curr)),
    damping: parseFloat($('#ml-damping').val().toString()),
    gradientDifference: parseFloat($('#ml-gradientDifference').val().toString()),
    maxIterations: parseFloat($('#ml-maxIterations').val().toString()),
    errorTolerance: parseFloat($('#ml-errorTolerance').val().toString()),
    alignToData: true,
  };

  console.log(`before: ${JSON.stringify(options)}`);

  const lmData = {
    x: data2.map(p => p.x),
    y: data2.map(p => p.y),
  };

  const res = LM(lmData, lorentzianQuickFit, options);

  console.log(`Quick fit result ${JSON.stringify(res)}`);

  if (initialLorentzianParams.length === 1) {
    const r = replaceAt(res.parameterValues, 4, 100);
    return [LorentzianParams.fromArray(r)];
  }

  return arrayInWindows(<number []> res.parameterValues, LorentzianParams.numberOfParams)
    .map(ps => LorentzianParams.fromArray(ps));
}

function replaceAt<T>(array: T[], index: number, value: T) {
  const ret = array.slice(0);
  ret[index] = value;
  return ret;
}
