import { LorentzianParams } from './Lorentzian';

export class URLAppParams {
  readonly files: string[];
  readonly params: LorentzianParams[];

  constructor(files: string[], params: LorentzianParams[]) {
    this.files = files;
    this.params = params;
  }

  equals(another: URLAppParams): boolean {
    return another !== null &&
      this.files === another.files &&
      this.params === another.params;
  }
}

export function extractParams(url: string): URLAppParams {
  const splitted = url.split('?');
  if (splitted.length > 1) {
    const query = splitted[1];
    const queryParts = query.split('&');
    const arrayOfKeyValues = queryParts.map(s => s.split('=')).filter(keyValue => keyValue.length === 2);

    const obj = new Map<string, string>();
    arrayOfKeyValues.forEach((tuple) => {
      obj.set(tuple[0], tuple[1]);
    });

    let i = 0;
    const files = [];
    while (obj.has('file' + i)) {
      const v = obj.get('file' + i);
      files.push(decodeURIComponent(v));
      i += 1;
    }

    i = 0;
    const params = [];
    while (obj.has('w' + i) && obj.has('cens' + i) && obj.has('eps' + i) && obj.has('bhf' + i) && obj.has('int' + i)) {
      params.push(new LorentzianParams(
        parseFloat(obj.get('w' + i)),
        parseFloat(obj.get('cens' + i)),
        parseFloat(obj.get('eps' + i)),
        parseFloat(obj.get('bhf' + i)),
        parseInt(obj.get('int' + i), 10),
      ));
      i += 1;
    }
    return new URLAppParams(files, params);
  }
  return new URLAppParams([], []);
}
