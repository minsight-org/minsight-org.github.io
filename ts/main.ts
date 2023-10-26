import * as $ from 'jquery';
import { LorentzianParams } from './Lorentzian';
import { LorentzianSitesUI } from './LorentzianSitesUI';
import { Dashboard, FileContentsForUI } from './Dasbhoard';
import { DataPicker } from './DataPicker';
import { FileTable } from './FileTable';
import { extractParams } from './URLHelpers';
import { quickFit } from './QuickFitting';

const vanillaToasts = require('vanillatoasts');

let visibleFiles: FileContentsForUI[] = [];

$(document).ready(() => {
  const urlParams = extractParams(window.location.href);
  console.log(urlParams.files);

  // unfortunately `if` is not an expression in typescript
  let initialLorentzianParams: LorentzianParams[];
  if (urlParams.params.length > 0) {
    initialLorentzianParams = urlParams.params;
  } else {
    initialLorentzianParams = [LorentzianParams.defaultParams];
  }
  const sitesComponent = new LorentzianSitesUI($('#lorenz-parameters'), LorentzianParams.defaultParams);
  initialLorentzianParams.forEach(params => sitesComponent.appendRow(params));

  const dashboard = new Dashboard('#plot', subcomponentsEnabled());

  $.get('/meta/dataset.json').then(
    (payload) => {
      console.log(`loaded file: ds.json`);
      const dataPicker = new DataPicker(payload);
      urlParams.files.forEach(file => dataPicker.fetchFromUrl(file));
      const fileTable = new FileTable(dataPicker, $('#loaded_files'));

      fileTable.onChange((allFiles) => {
        visibleFiles = allFiles.filter(f => f.visible === true).map(f => f.file);
        dashboard.redrawForNewData(visibleFiles, sitesComponent.getParams());
        installEventHandlers(dashboard, sitesComponent, dataPicker);
      });

      installEventHandlers(dashboard, sitesComponent, dataPicker);

      $('#open_file_selector').click(() => dataPicker.showDialog());
      $('#permalink').click(() => permalink(fileTable, sitesComponent));
      $('#quick-fit').click(() => {
        const currentFiles = fileTable.getFiles();
        if (currentFiles.length > 0) {
          console.log('quick fit!');
          // TODO: add toast which explains user that we fit against the first file
          const fitted = quickFit(sitesComponent.getParams(), currentFiles[0].file.contents.points);
          console.log('quick fitted: ' + fitted);
          for (const i in fitted) {
            sitesComponent.setParamsForSite(parseInt(i, 10), fitted[i].toFixed(1000));
          }
          const allSitesParams = sitesComponent.getParams();
          dashboard.redrawForNewLorenz(allSitesParams, subcomponentsEnabled());
        } else {
          console.log('No data selected');
        }
      });
      $('#subcomponents-enabled').click(() => {
        const allSitesParams = sitesComponent.getParams();
        const newState = subcomponentsEnabled();

        dashboard.redrawForNewLorenz(allSitesParams, newState);
        $('#subcomponents-enabled').prop('checked', newState);
      });

      const allSitesParams = sitesComponent.getParams();
      dashboard.redrawForNewLorenz(allSitesParams, subcomponentsEnabled());
    },
    this.defaultHttpErrorHandler);
});

function permalink(fileTable: FileTable, sitesComponent: LorentzianSitesUI): void {
  const urls = fileTable.getFiles().map(f => f.url).filter(f => f != null);
  let i = 0;
  const filesPartQuery = urls.map((url) => {
    const queryPart = `file${i}=${encodeURIComponent(url)}`;
    i += 1;
    return queryPart;
  }).join('&');

  const lorentzianParams = sitesComponent.getParams();
  let j = 0;
  const paramsPartQuery = lorentzianParams.map((params) => {
    const part = params.encodeAsUrl(j.toString());
    j += 1;
    return part;
  }).join('&');

  const splitted = window.location.href.split('?');
  const withoutQuery = splitted[0];
  const permalink = `${withoutQuery}?${filesPartQuery}&${paramsPartQuery}`;

  setClipboard(permalink);

  vanillaToasts.create({
    title: 'Copied!',
    text: 'Copied to clipboard',
    type: 'success', // success, info, warning, error   / optional parameter
    timeout: 2500, // hide after 5000ms, // optional parameter
  });
}

function installEventHandlers(dashboard: Dashboard, sitesComponent: LorentzianSitesUI, dataPicker: DataPicker): void {
  function uninstallLorentzianParametrChangedHandler(): void {
    sitesComponent.inputComponents().map(c => c.unbind('change'));
  }

  function lorentzianParameterChangedHandler(): void {
    const allSitesParams = sitesComponent.getParams();
    dashboard.redrawForNewLorenz(allSitesParams, subcomponentsEnabled());
  }

  sitesComponent.inputComponents().map(c => c.change(lorentzianParameterChangedHandler));

  // TODO: it's a bit fishy and might end up with callback hell
  sitesComponent.singleOnChangeCallback(() => {
    uninstallLorentzianParametrChangedHandler();
    lorentzianParameterChangedHandler();
    installEventHandlers(dashboard, sitesComponent, dataPicker);
  });
}

// copy-pasted from: https://stackoverflow.com/a/42416105/429311
function setClipboard(value: string): void {
  const tempInput = document.createElement('input');
  tempInput.setAttribute('style', 'position: absolute; left: -1000px; top: -1000px');
  tempInput.value = value;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);
}

function subcomponentsEnabled(): boolean {
  return $('#subcomponents-enabled').prop('checked');
}
