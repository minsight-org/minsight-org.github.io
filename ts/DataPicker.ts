import * as $ from 'jquery';
import { parseFile, FileContents } from './DataParser';
const vanillaTree = require('vanillatree');

export class DataPicker {
  private onFileLoadedCallbacks: ((res: [string, FileContents]) => void)[] = [];

  private static vex: any = null;

  private nextId = 0;
  private idToUrlMap: Map<string, string> = new Map<string, string>();
  private dataSetSummary: any;

  constructor(dataSetSummary: any) {
    this.dataSetSummary = dataSetSummary;

    if (DataPicker.vex === null) {
      DataPicker.vex = require('vex-js');
      DataPicker.vex.registerPlugin(require('vex-dialog'));
      DataPicker.vex.defaultOptions.className = 'vex-theme-os';
    }
  }

  getNextId(): string {
    const current = this.nextId;
    this.nextId = current + 1;
    return current.toString();
  }

  createNextTreeLevel(parent: string, jsonInput: any, tree: any): Map<string, string> {
    if (Array.isArray(jsonInput)) {
      jsonInput.forEach((v) => {
        const id = this.getNextId();
        tree.add({
          parent,
          id,
          label: v.label,
          opened: false,
        });
        this.idToUrlMap.set(id, v.url);
      });
    } else {
      for (const key in jsonInput) {
        if (!jsonInput.hasOwnProperty(key)) continue;

        const id = this.getNextId();
        tree.add({
          parent,
          id,
          label: key,
          opened: false,
        });

        this.createNextTreeLevel(id, jsonInput[key], tree);
      }
    }
    return this.idToUrlMap;
  }

  public showDialog = () => {
    const dialog = DataPicker.vex.dialog.open({
      message: 'Select a file.',
      input: [
        '<div class="vex-custom-field-wrapper">',
        '<label for="select-file">From server</label>',
        `<div id="file-select"></div>`,
        '<label for="upload">From computer</label>',
        '<div class="vex-custom-input-wrapper">',
        '<input name="upload" type="file" id="upload" />',
        '</div>',
        '</div>',
      ].join(''),
      callback: (data: any) => {
        if (!data) {
          return console.log('Cancelled');
        }
        console.log('Date', data.upload);
        $('.demo-result-custom-vex-dialog').show().html([
          '<h4>Result</h4>',
          '<p>',
          'Date: <b>' + data.date + '</b><br/>',
          'Color: <input type="color" value="' + data.color + '" readonly />',
          '</p>',
        ].join(''));
      },
      afterOpen: () => {
        const tree = new vanillaTree($('#file-select'));

        const toUrlMap = this.createNextTreeLevel(null, this.dataSetSummary, tree);

        $('#file-select').get().pop().addEventListener('vtree-select', (evt: any) => {
          if (toUrlMap.has(evt.detail.id)) {
            console.log('vtree-select triggered, evt' + evt.detail.id);
            console.log('url:' + toUrlMap.get(evt.detail.id));
            const fileUrl = 'dataset/' + toUrlMap.get(evt.detail.id);
            console.log('here url: ' + fileUrl);
            this.fetchFromUrl(fileUrl);
          }
        });
      },
    });

    $('#upload').on('change', () => {
      console.log('uploaded');

      this.handleFile((<any> event.target).files[0], dialog);
    });

    $('#file-select').on('change', (e) => {
      const url = $(e.target).find(':selected').attr('value');
      this.fetchFromUrl(url);
    });
  }

  onFileLoaded(fn: (res: [string, FileContents]) => void): void {
    this.onFileLoadedCallbacks.push(fn);
  }

  fetchFromUrl(url: string): void {
    $.get(url).then(
      (payload) => {
        const contents = parseFile(payload);
        console.log(`loaded file: ${contents.metadata.description}`);

        this.onFileLoadedCallbacks.forEach(cb => cb([url, contents]));
      },
      this.defaultHttpErrorHandler);
  }

  private handleFile(file: any, dialog: any): void {
    if ((<any> window).FileReader) { // TODO: it's not very elegant
      this.getAsText(file, dialog);
    } else {
      alert('FileReader is not supported in this browser.');
    }
  }

  private getAsText(file: any, dialog: any): void {
    const reader = new FileReader();

    reader.onload = (data) => {
      console.log(`loaded file successfully`);

      const contents = parseFile(data.target.result);

      console.log(`loaded file: ${contents.metadata.description}`);

      this.onFileLoadedCallbacks.forEach(cb => cb([null, contents]));
      dialog.close();
    };

    reader.onerror = err => console.log(err);
    reader.readAsText(file);
  }

  private defaultHttpErrorHandler(error: any): void {
    console.log(`error: ${error}`);
  }
}
