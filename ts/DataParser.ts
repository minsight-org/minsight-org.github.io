export type Metadata = {
  readonly sampleId: string;
  readonly description: string;
  readonly owner: string;
  // TODO: in future might be numeric with proper unit conversions implemented
  readonly temperature: string;
  readonly publication: string;
};

export type FirstLineOfSpectrumDetected = {
  readonly firstLine: number;
  readonly delimiter: string;
};

export type Point = {
  readonly x: number;
  readonly y: number;
};

// TODO: Probably not the best place for this type
// TODO: it cries for something like scala case class
export class Stats {
  readonly min: number;
  readonly max: number;
  readonly peakIntensity: number;

  constructor(min: number, max: number, peakIntensity: number) {
    this.min = min;
    this.max = max;
    this.peakIntensity = peakIntensity;
  }

  equals(anotherStats: Stats): boolean {
    return anotherStats !== null &&
      this.min === anotherStats.min &&
      this.max === anotherStats.max &&
      this.peakIntensity === anotherStats.peakIntensity;
  }
}

export function makePoint(x: number, y: number): Point {
  return {
    x,
    y,
  };
}

export type FileContents = {
  readonly metadata?: Metadata;
  readonly points: Point[];
};

export function lines(input: string): string[] {
  let eof: string;

  const index = input.indexOf('\n');
  if (input[index - 1] === '\r') {
    eof = '\r\n';
  } else {
    eof = '\n';
  }

  return input.split(eof);
}

export function parseMetadata(lines: string[]): Metadata | null {
  if (lines.length >= 5) {
    return {
      sampleId: lines[0],
      description: lines[1],
      owner: lines[2],
      temperature: lines[3],
      publication: lines[4],
    };
  }

  return null;
}

function isDataWithDelimiter(delimiter: string): (line: string) => boolean {
  return function (line: string): boolean {
    const splitted = line.split(delimiter);
    return splitted.length === 2
      && !Number.isNaN(Number(splitted[0]))
      && !Number.isNaN(Number(splitted[1]));
  };
}

export function detectFirstLineOfSpectrum(lines: string[]): FirstLineOfSpectrumDetected | null {
  let del: string = null;
  const index = lines.findIndex((line) => {
    if (isDataWithDelimiter('\t')(line)) {
      del = '\t';
      return true;
    }
    if (isDataWithDelimiter(' ')(line)) {
      del = ' ';
      return true;
    }
    if (isDataWithDelimiter(',')(line)) {
      del = ',';
      return true;
    }

    return false;
  });

  if (index === -1) {
    return null;
  }
  return { firstLine: index, delimiter: del };
}

export function parseSpectrum(lines: string[],
                              from: number,
                              delimiter: string): Point[] {

  const dataLines = lines.slice(from);

  const points = dataLines
    .map(line => line.split(delimiter))
    .filter(line => line.length === 2)
    .reduce<Point[]>((acc, curr) => {
      const xx = Number(curr[0]);
      const yy = Number(curr[1]);
      if (!Number.isNaN(xx) && !Number.isNaN(yy)) {
        acc.push({ x: xx, y: yy });
      }
      return acc;
    },               []);

  return points;
}

export function parseFile(input: string): FileContents {
  const allLines = lines(input);

  let meta: Metadata = null;

  const firstLine = detectFirstLineOfSpectrum(allLines);

  if (firstLine !== null && firstLine.firstLine > 4) {
    meta = parseMetadata(allLines);
  }

  if (firstLine !== null) {
    const data = parseSpectrum(allLines, firstLine.firstLine, firstLine.delimiter);

    return { metadata: meta, points: data };
  }
  return { metadata: null, points: [] };
}
