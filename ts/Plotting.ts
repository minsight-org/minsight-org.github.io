import { select, scaleLinear, axisBottom, axisLeft, ScaleLinear,
  event, line, curveCardinal } from 'd3';
import { Point, makePoint } from './DataParser';
import { sampleRange } from './Helpers';
import * as $ from 'jquery';

export class Plot {
  private group: d3.Selection<any, any, any, any>;
  private tooltip: d3.Selection<any, any, any, any>;

  private readonly xScale: ScaleLinear<number, number>;
  private readonly yScale: ScaleLinear<number, number>;

  private readonly xPixels = 900;
  private readonly yPixels = 600;

  private readonly container: string;

  // TODO: introduce proper range type
  private xDomainMin = -12.0;
  private xDomainMax =  12.0;
  private sampledDomain = sampleRange(this.xDomainMin, this.xDomainMax, this.xPixels);

  constructor(container: string, min: number, max: number) {
    this.container = container;
    this.group = select(container).append('g');
    this.tooltip = select('#plotting')
                    .append('div')
                    .attr('class', 'tooltip')
                    .style('opacity', 0);

    this.yScale = scaleLinear();
    this.yScale.domain([min, max]);
    this.yScale.range([this.yPixels, 0]);
    const yAxis = axisLeft(this.yScale);
    this.group
      .call(yAxis)
      .attr('transform', 'translate(80 20)');

    this.xScale = scaleLinear();
    this.xScale.domain([this.xDomainMin, this.xDomainMax]);
    this.xScale.range([0, this.xPixels]);
    const xAxis = axisBottom(this.xScale);
    this.group
      .append('g')
      .call(xAxis)
      .attr('transform', `translate(0, ${this.yPixels})`);
  }

  destroy(): void {
    $(this.container).empty();
  }

  drawData(data: Point[], color: string): void {
    this.scatterData(this.xScale, this.yScale, color, data);
  }

  sampleFunction(fun: (n: number) => number): Point[] {
    return this.sampledDomain.map(x => makePoint(x, fun(x)));
  }

  // aah, is Typescript really so limited that we cannot simply `fun: number => number`
  drawFunctionPoints(points: Point[], color: string): d3.Selection<any, any, any, any> {
    const dataLine = line<Point>().x(d => this.xScale(d.x)).y(d => this.yScale(d.y));

    return this.group
        .append('path')
        .attr('d', dataLine(points))
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1);
  }

  // TODO: rewrite it more in FP fashion
  private scatterData(xScale: ScaleLinear<number, number>,
                      yScale: ScaleLinear<number, number>,
                      color: string,
                      data: Point[]): void {

    const onOver = tipMouseover(this.tooltip);
    const onOut  = tipMouseout(this.tooltip);
    this.group.append('g').selectAll('.post')
      .data(data)
      .enter()
      .append('circle')
      .classed('post', true)
      .attr('r', 3)
      .attr('fill', color)
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .on('mouseover', onOver)
      .on('mouseout', onOut);

    // TODO: understand how imports work to be able to write something like `const line = d3.line...`
    const dataLine = line<Point>().curve(curveCardinal.tension(0.5))
      .x(d => xScale(d.x)).y(d => yScale(d.y));
    this.group
        .append('path')
        .attr('d', dataLine(data))
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1);
  }
}

function tipMouseover<G>(tooltip: d3.Selection<any, any, any, any>):
  (datum: Point, index: number, groups: G[] | ArrayLike<G>) => void {
  return (datum) => {
    const html  = `x: ${datum.x}<br />y: ${datum.y}`;

    tooltip.html(html)
      .style('left', (event.pageX + 15) + 'px')
      .style('top', (event.pageY - 28) + 'px')
      .transition()
      .duration(200) // ms
      .style('opacity', .9); // started as 0!
  };
}

function tipMouseout<G>(tooltip: d3.Selection<any, any, any, any>):
  (datum: Point, index: number, groups: G[] | ArrayLike<G>) => void {
  return () => {
    tooltip.transition()
      .duration(300) // ms
      .style('opacity', 0); // don't care about position!
  };
}
