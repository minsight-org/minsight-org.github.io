import { DataPicker } from './DataPicker';
import { FileContentsForUI } from './Dasbhoard';
import * as $ from 'jquery';

export class FileTable {
  // private readonly dataPicker: DataPicker;
  private readonly files: FileTableEntry[] = [];
  private onChangeCallbacks: ((res: FileTableEntry[]) => void)[] = [];
  private readonly dataColors = ['red', 'green', 'blue'];

  constructor(dataPicker: DataPicker, uiComponent: JQuery<HTMLElement>) {
    // TODO: `callbacks` is a terrible hack to circumvent `this` problems... `callbacks` is always `onChangeCallbacks`
    function redrawFileTable(callbacks: ((res: FileTableEntry[]) => void)[], files: FileTableEntry[]): void {
      function append(component: JQuery<HTMLElement>, file: FileTableEntry, index: number): void {
        console.log(`append: ${file.file.contents.metadata.description} ${file.visible}`);

        const metadata = file.file.contents.metadata;
        const html = `<div class="loaded_file">
            <div class="loaded_file_title">
              <svg xmlns="http://www.w3.org/2000/svg" class="loaded_file_legend">
                <rect x="0" y="0" width="40" height="14" style="fill:${file.file.color};"></rect>
              </svg>
              <h4>${metadata.description}</h4>
              <input class="loaded_file_toggle" type="checkbox" ${file.visible ? 'checked' : ''}
                name="loaded_file_toggle_${index}" />
              <div style="clear: both"></div>
            </div>
            <p><span class="title">Owner: </span>${metadata.owner}</p>
            <p><span class="title">Temperature: </span>${metadata.temperature}</p>
            <p><span class="title">Publication: </span>${metadata.publication}</p>
        </div>`;
        component.append(html);
      }
      uiComponent.empty();
      files.forEach(((x, index) => append(uiComponent, x, index)));
      uiComponent.find('.loaded_file_toggle').click((e) => {
        const items = $(e.target).attr('name').split('_');
        const changedIndex: number = Number(items[items.length - 1]);
        files[changedIndex] = files[changedIndex].copyWithVisible(!files[changedIndex].visible);
        callbacks.forEach(cb => cb(files));
      });
    }

    dataPicker.onFileLoaded((res) => {
      const fcForUi = new FileContentsForUI(res[1], this.nextColor());
      // TODO: fromServer (second param) should be decided in DataPicker!
      const fileEntry = new FileTableEntry(fcForUi, true, true, res[0]);
      this.files.push(fileEntry);

      this.onChangeCallbacks.forEach(cb => cb(this.files));
    });

    // you cannot use just `this.onChange(files => redrawFileTable(files));`
    // as than `this` is broken as stated https://github.com/Microsoft/TypeScript/wiki/'this'-in-TypeScript#fixes
    this.onChange(files => redrawFileTable(this.onChangeCallbacks, files));
  }

  onChange(fun: (res: FileTableEntry[]) => void): void {
    this.onChangeCallbacks.push(fun);
  }

  getFiles(): FileTableEntry[] {
    return this.files;
  }

  private nextColor(): string {
    const index = (this.files.length < this.dataColors.length) ?
    this.files.length : this.dataColors.length - 1;
    return this.dataColors[index];
  }

}

export class FileTableEntry {
  readonly visible: boolean;
  readonly fromServer: boolean;
  readonly file: FileContentsForUI;
  readonly url?: string;

  constructor(file: FileContentsForUI, fromServer: boolean, visible: boolean, url?: string) {
    this.file = file;
    this.fromServer = fromServer;
    this.visible = visible;
    this.url = url;
  }

  copyWithVisible(visible: boolean): FileTableEntry {
    return new FileTableEntry(this.file, this.fromServer, visible);
  }
}
