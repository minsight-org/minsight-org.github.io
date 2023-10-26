import { LorentzianSiteUI } from './LorentzianSiteUI';
import { LorentzianParams } from './Lorentzian';

export class LorentzianSitesUI {
  private readonly tbodyElement: JQuery<HTMLElement>;
  private sites: LorentzianSiteUI[] = [];
  private onChangeCallback: (() => void) = () => {};

  constructor(parentTable: JQuery<HTMLElement>, initialParams: LorentzianParams) {
    const html = `<tbody></tbody>
      <tfoot>
        <tr>
          <td><button id="add-site" class="button">Add site</button></td>
        </tr>
      </tfoot>`;

    parentTable.append(html);

    this.tbodyElement = parentTable.find('tbody');
    console.log('this.tbodyElement: ' + this.tbodyElement);
    parentTable.find('#add-site').click(() => {
      this.appendRow(initialParams);
    });
  }

  appendRow(params: LorentzianParams): void {
    const newRow = new LorentzianSiteUI(params, this.sites.length + 1);

    this.tbodyElement.append(newRow.getRootElement());
    this.sites.push(newRow);

    this.controlDeleteButtons();
    newRow.onRemove((removedComponentId) => {
      console.log('onRemove: ' + this.sites.length);
      this.sites = this.sites.filter(s => s.syntheticId !== removedComponentId);
      console.log('onRemove2: ' + this.sites.length);
      this.controlDeleteButtons();
      this.fireOnChangeCallback();
    });

    this.fireOnChangeCallback();
  }

  getParams(): LorentzianParams[] {
    return this.sites.map(site => site.getParams());
  }

  setParamsForSite(siteIndex: number, newParams: LorentzianParams): void {
    this.sites[siteIndex].setParams(newParams);
  }

  inputComponents(): JQuery<HTMLElement>[] {
    const nested = this.sites.map(s => s.getComponents());

    // flatten arrays according to:
    // https://schneidenbach.gitbooks.io/typescript-cookbook/functional-programming/flattening-array-of-arrays.html
    return [].concat(...nested);
  }

  singleOnChangeCallback(fn: () => void): void {
    this.onChangeCallback = fn;
  }

  private controlDeleteButtons(): void {
    const enable = this.sites.length > 1 ? true : false;
    this.sites.forEach(s => s.controlRemoveButton(enable));
  }

  private fireOnChangeCallback(): void {
    this.onChangeCallback();
  }

}
