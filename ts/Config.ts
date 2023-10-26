export class Boundary {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }
}

export class Config {
  static sitesColors: string[] = [
    '#f98585',
    '#d4f985',
    '#85f9f3',
    '#283aff',
    '#ef0093',
  ];

  static defaultColor: string = '#dedede';

  static getColor(index: number): string {
    if (index < this.sitesColors.length) {
      return this.sitesColors[index];
    }
    return this.defaultColor;
  }

  static lorWBoundary = new Boundary(0, 0.5);
  static lorCensBoundary = new Boundary(-1.0, 4.0);
  static lorEpsBoundary = new Boundary(-0.7, 4.0);
  static lorBhfBoundary = new Boundary(0, 54.0);
  static lorPearkIntensityBoundary = new Boundary(0, 100.0);
}
