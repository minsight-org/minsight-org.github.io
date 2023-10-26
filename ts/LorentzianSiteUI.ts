import { LorentzianParams } from './Lorentzian';
import * as $ from 'jquery';
import { SliderInput } from './SliderInput';
import { Config } from './Config';

export class LorentzianSiteUI {
  // we need it to be able to identify LorentzianSiteUI within LorentzianSitesUI onRemove callback
  private static nextSyntheticId = 0;

  readonly syntheticId: number;
  private readonly wElement: JQuery<HTMLElement>;
  private readonly censElement: JQuery<HTMLElement>;
  private readonly epsElement: JQuery<HTMLElement>;
  private readonly bhfElement: JQuery<HTMLElement>;
  private readonly peakIntensityElement: JQuery<HTMLElement>;
  private readonly components: JQuery<HTMLElement>[];

  private readonly rootElement: JQuery<HTMLElement>;
  private onRemoveCallbacks: ((n: number) => void)[] = [];

  private readonly siteIdHtmlClassName: string = 'site-id';

  // all first 5 parametrs are HTML class names of elements
  // rootElement is HTML element which is nearest common ancestor of all inputs (some table row for now)
  constructor(params: LorentzianParams, id: number) {
    this.syntheticId = LorentzianSiteUI.nextSyntheticId;
    LorentzianSiteUI.nextSyntheticId += 1;

    const html = `<tr>
        <td class="${this.siteIdHtmlClassName}" style="background-color: ${Config.getColor(id - 1)}">Site ${id}</td>
        <td><input class="lorenz-w" type="text" value="${params.w}" /></td>
        <td><input class="lorenz-cens" type="text" value="${params.cens}" /></td>
        <td><input class="lorenz-eps" type="text" value="${params.eps}" /></td>
        <td><input class="lorenz-bhf" type="text" value="${params.bhf}" /></td>
        <td><input class="lorenz-peak-intensity" type="text" value="${params.peakIntensity}" /></td>
        <td><td><button class="button remove-site">Remove</button></td></td>
    </tr>`;

    this.rootElement = $(html);

    this.wElement = this.rootElement.find('.lorenz-w');
    this.censElement = this.rootElement.find('.lorenz-cens');
    this.epsElement = this.rootElement.find('.lorenz-eps');
    this.bhfElement = this.rootElement.find('.lorenz-bhf');
    this.peakIntensityElement = this.rootElement.find('.lorenz-peak-intensity');
    this.components = [this.wElement, this.censElement, this.epsElement, this.bhfElement, this.peakIntensityElement];

    new SliderInput(this.rootElement.find('.lorenz-w'), Config.lorWBoundary.min, Config.lorWBoundary.max, 0.001);
    new SliderInput(this.rootElement.find('.lorenz-cens'), Config.lorCensBoundary.min,
                    Config.lorCensBoundary.max, 0.01);
    new SliderInput(this.rootElement.find('.lorenz-eps'), Config.lorEpsBoundary.min, Config.lorEpsBoundary.max, 0.01);
    new SliderInput(this.rootElement.find('.lorenz-bhf'), Config.lorBhfBoundary.min, Config.lorBhfBoundary.max, 0.1);
    new SliderInput(this.rootElement.find('.lorenz-peak-intensity'), Config.lorPearkIntensityBoundary.min,
                    Config.lorPearkIntensityBoundary.max, 1);

    this.rootElement.find('.remove-site').click(() => {
      this.rootElement.remove();

      // If we have e.g. 3 sites and user removes the first one we would end up with "Site 2, Site 3" which
      // may look weird
      // In order to avoid that we need to change UI labels to "Site 1, Site 2"
      $(`.${this.siteIdHtmlClassName}`).toArray().forEach((element, index) => {
        element.innerText = `Site ${index + 1}`;
        element.style.backgroundColor = Config.getColor(index);
      });

      this.onRemoveCallbacks.forEach(cb => cb(this.syntheticId));
    });
  }

  getRootElement(): JQuery<HTMLElement> {
    return this.rootElement;
  }

  getComponents(): JQuery<HTMLElement>[] {
    return this.components;
  }

  getParams(): LorentzianParams {
    function numeric(el: JQuery<HTMLElement>): number {
      return parseFloat(<string>el.val());
    }

    return new LorentzianParams(
      numeric(this.wElement),
      numeric(this.censElement),
      numeric(this.epsElement),
      numeric(this.bhfElement),
      numeric(this.peakIntensityElement),
    );
  }

  setParams(newParams: LorentzianParams): void {
    this.wElement.val(newParams.w).trigger('input');
    this.censElement.val(newParams.cens).trigger('input');
    this.epsElement.val(newParams.eps).trigger('input');
    this.bhfElement.val(newParams.bhf).trigger('input');
    this.peakIntensityElement.val(newParams.peakIntensity).trigger('input');
  }

  controlRemoveButton(enabled: boolean): void {
    this.rootElement.find('.remove-site').prop('disabled', !enabled);
  }

  onRemove(fun: (n: number) => void): void {
    this.onRemoveCallbacks.push(fun);
  }
}
