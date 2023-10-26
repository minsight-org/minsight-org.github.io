import { arrayInWindows } from './Helpers';

export class LorentzianParams {
  readonly w: number;
  readonly cens: number;
  readonly eps: number;
  readonly bhf: number;
  readonly peakIntensity: number;

  static fromArray(arr: number[]): LorentzianParams {
    return new LorentzianParams(arr[0], arr[1], arr[2], arr[3], arr[4]);
  }

  static defaultParams: LorentzianParams = new LorentzianParams(0.097, 0.35, 0.01, 46, 100);

  static numberOfParams = LorentzianParams.defaultParams.toArray().length;

  constructor(w: number, cens: number, eps: number, bhf: number, peakIntensity: number) {
    this.w = w;
    this.cens = cens;
    this.eps = eps;
    this.bhf = bhf;
    this.peakIntensity = peakIntensity;
  }

  toArray(): number[] {
    return [this.w, this.cens, this.eps, this.bhf, this.peakIntensity];
  }

  toFixed(n: number) {
    function rounded(m: number) {
      return Math.round(m * n) / n;
    }

    return new LorentzianParams(rounded(this.w), rounded(this.cens), rounded(this.eps),
                                rounded(this.bhf), rounded(this.peakIntensity));
  }

  encodeAsUrl(suffix: string): string {
    const w = `w${suffix}=${this.w}`;
    const cens = `cens${suffix}=${this.cens}`;
    const eps = `eps${suffix}=${this.eps}`;
    const bhf = `bhf${suffix}=${this.bhf}`;
    const int = `int${suffix}=${this.peakIntensity}`;
    return [w, cens, eps, bhf, int].join('&');
  }
}

export const lorentzian = (w: number, cens: number, eps: number, bhf: number, peakIntensity: number) => (x: number) => {
  const bhfPart = bhf / 32.95;

  const halfEps = eps / 2.0;
  const x1 = ((-bhfPart) * halfD3) + cens + halfEps;
  const x2 = ((-bhfPart) * halfD2) + cens - halfEps;
  const x3 = ((-bhfPart) * halfD1) + cens - halfEps;
  const x4 = (bhfPart    * halfD1) + cens - halfEps;
  const x5 = (bhfPart    * halfD2) + cens - halfEps;
  const x6 = (bhfPart    * halfD3) + cens + halfEps;

  const l1 = singlet(peakIntensity, w)(x, x1) * 3;
  const l2 = singlet(peakIntensity, w)(x, x2) * 2;
  const l3 = singlet(peakIntensity, w)(x, x3) * 1;
  const l4 = singlet(peakIntensity, w)(x, x4) * 1;
  const l5 = singlet(peakIntensity, w)(x, x5) * 2;
  const l6 = singlet(peakIntensity, w)(x, x6) * 3;
  const sextet = l1 + l2 + l3 + l4 + l5 + l6;

  return sextet;
};

// https://www.npmjs.com/package/ml-levenberg-marquardt API requires us to express params as array
export const lorentzianQuickFit = (params: number[]) => (x: number) => {
  // if (params.length === 5) {
  //   const r = lorentzian(params[0], params[1], params[2], params[3], params[4])(x);
  //   // console.log(`bazinga r: ${r}, params: ${params}, x: ${x}`);
  //   return r;
  // }

  const results = arrayInWindows(params, LorentzianParams.numberOfParams).map((singleSiteParams) => {
    return lorentzian(singleSiteParams[0], singleSiteParams[1], singleSiteParams[2],
                      singleSiteParams[3], singleSiteParams[4])(x);
  });

  const r = results.reduce((acc, curr) => acc + curr, 0);
  return r;
};

export function lorentzianF(params: LorentzianParams): (x: number) => number {
  return lorentzian(params.w, params.cens, params.eps, params.bhf, params.peakIntensity);
}

const singlet = (peakIntensity: number, w: number) => (x: number, peak: number) => {
  const numerator = w / 2.0;
  // TODO: consult it. Actually in PDF it says `Math.pow((w / 2), 2)`
  const denominator = (Math.PI * (Math.pow((x - peak), 2) + Math.pow(w, 2) / 2));
  // TODO: consult it. also, I have no idea what this -100 (`var r1` in old code) and `/3` is about
  return (-1 * peakIntensity) * (numerator / denominator) / 3;
};

const halfD1  = 1.677 / 2.0;
const halfD2  = 6.167 / 2.0;
const halfD3  = 10.657 / 2.0;
