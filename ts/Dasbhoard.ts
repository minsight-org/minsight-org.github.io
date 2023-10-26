import { makePoint, Stats, Point, FileContents } from './DataParser';
import { Config } from './Config';
import { Plot } from './Plotting';
import { lorentzianF, LorentzianParams } from './Lorentzian';
import { stats, alignPoints, computeShiftFunction } from './Helpers';

export class Dashboard {
  // We want to draw Lorentzian even if there's no data loaded. In such case we need some synthetic reference data:
  private readonly defaultReferenceStats: Stats;

  private plot: Plot = null;
  private readonly plotHtmlContainerSelector: string;
  private funPlotSelection: d3.Selection<any, any, any, any> = null;
  private funPlotSubSelections: d3.Selection<any, any, any, any>[] = [];
  private currentReference: Stats = this.defaultReferenceStats;
  // TODO: it's very hacky, find better way of tracking changes
  private lastRedrawLinesOfDataLength: number = -1;
  private drawSubcomponentsEnabled: boolean;

  constructor(plotHtmlContainerSelector: string, drawSubcomponentsEnabled: boolean) {
    this.plotHtmlContainerSelector = plotHtmlContainerSelector;
    this.defaultReferenceStats = stats([1000.0, 100.0]);
    this.currentReference = this.defaultReferenceStats;
    this.drawSubcomponentsEnabled = drawSubcomponentsEnabled;
    this.plot = new Plot(this.plotHtmlContainerSelector, this.currentReference.min, this.currentReference.max);
  }

  // We need a separate `redrawForNewLorenz` and `redrawForNewData` as `redrawForNewLorenz`
  // can be called very frequenty (because of slider)
  // TODO: `redrawForNewData` is quite convoluted and perhaps not optimal (from performance perspective)
  // A good idea may be have each "line of data" a synthetic id and keep track of them in Dashboard
  // so we can avoid unneccessary redraws
  redrawForNewData(linesOfData: FileContentsForUI[], lorentzianParams: LorentzianParams[]): void {
    if (linesOfData.length > 0) {
      const reference = stats(linesOfData[0].contents.points.map(p => p.y));
      this.currentReference = reference;

      const tail = linesOfData.slice(1);

      const effective = [linesOfData[0]].concat(tail.map((line) => {
        return line.copyWithPoints(alignPoints(reference, line.contents.points));
      }));

      if (this.lastRedrawLinesOfDataLength !== linesOfData.length) {
        this.destroyPlotIfNeeded();
        this.plot = new Plot(this.plotHtmlContainerSelector, reference.min, reference.max);
        this.redrawLorenz(lorentzianParams, this.currentReference);

        effective.forEach((lineOfData) => {
          this.plot.drawData(lineOfData.contents.points, lineOfData.color);
        });
      }
    } else {
      this.currentReference = this.defaultReferenceStats;
      this.destroyPlotIfNeeded();
      this.plot = new Plot(this.plotHtmlContainerSelector, this.currentReference.min, this.currentReference.max);
      this.redrawLorenz(lorentzianParams, this.currentReference);
    }
    this.lastRedrawLinesOfDataLength = linesOfData.length;
  }

  redrawForNewLorenz(lorentzianParams: LorentzianParams[], drawSubcomponentsEnabled: boolean): void {
    this.drawSubcomponentsEnabled = drawSubcomponentsEnabled;
    this.redrawLorenz(lorentzianParams, this.currentReference);
  }

  private redrawLorenz(lorentzianParams: LorentzianParams[], reference: Stats): void {
    const allLorPoints: Point[][] = lorentzianParams.map((siteParams) => {
      const lor = lorentzianF(siteParams);
      return this.plot.sampleFunction(lor);
    });
    const summedLorPoints = this.sumPoints(allLorPoints);

    const alignedLorPoints = alignPoints(reference, summedLorPoints);

    if (this.funPlotSelection !== null) {
      this.funPlotSelection.remove();
    }
    this.funPlotSubSelections.forEach((s) => { s.remove(); });
    this.funPlotSubSelections = [];
    if (allLorPoints.length > 1 && this.drawSubcomponentsEnabled) {
      this.redrawSubcomponents(allLorPoints, summedLorPoints, alignedLorPoints);
    }

    this.funPlotSelection = this.plot.drawFunctionPoints(alignedLorPoints, 'black');
  }

  private redrawSubcomponents(allLorPoints: Point[][], summedLorPoints: Point[], alignedLorPoints: Point[]): void {
    const factors = computeShiftFunction(summedLorPoints.map(p => p.y), alignedLorPoints.map(p => p.y));
    // `a` and `b` stands for parameters `a` and `b` in f(x) = a * x + b
    // as in https://en.wikipedia.org/wiki/Linear_function
    const a = factors[0];
    const b = factors[1];

    allLorPoints.forEach((lorPoints, index) => {
      const shiftedPoints = lorPoints.map((p) => {
        const newY = a * p.y + b;
        return makePoint(p.x, newY);
      });
      const color = Config.getColor(index);
      this.funPlotSubSelections.push(this.plot.drawFunctionPoints(shiftedPoints, color));
    });
  }

  private destroyPlotIfNeeded(): void {
    console.log('destroy!!');
    if (this.plot !== null) {
      this.plot.destroy();
    }
  }

  // returns list of Points which `x` is taken from `x` of first array and `y` is a sum of all
  // correspoding points `y`
  private sumPoints(allPoints: Point[][]): Point[] {
    const head = allPoints[0];
    const tail = allPoints.slice(1);

    return head.map((point, index) => {
      // ps[index] is safe if head and each of tail's arrays are of the same length
      // They should be of the same length as they're created with the same's plot (i.e. `plot.sampleFunction`)
      const tailYSum = (tail.length > 0) ? tail.map(ps => ps[index].y).reduce((acc, curr) => acc + curr) : 0;
      return { x: point.x, y: point.y + tailYSum };
    });
  }
}

export class FileContentsForUI {
  contents: FileContents;
  color: string;

  constructor(contents: FileContents, color: string) {
    this.contents = contents;
    this.color = color;
  }

  // TODO: again, with case classes we'd have it for free
  copyWithPoints(newPoints: Point[]): FileContentsForUI {
    const newContents = { metadata: this.contents.metadata, points: newPoints };
    return new FileContentsForUI(newContents, this.color);
  }
}
