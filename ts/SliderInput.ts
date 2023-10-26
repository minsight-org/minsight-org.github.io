import * as $ from 'jquery';

export class SliderInput {
  constructor(inputEl: JQuery<HTMLElement>, sliderMin: number, sliderMax: number, step: number) {
    const initValue = inputEl.val();
    const newEl =
      $(`<div class="slidecontainer">
        <input class="slider" type="range" min="${sliderMin}" max="${sliderMax}" value="${initValue}" step=${step} />
      </div>`);
    newEl.insertBefore(inputEl);
    newEl.prepend(inputEl);
    const slider = newEl.find('.slider');

    slider.on('input', (e) => {
      const newSliderValue = $(e.target).val();
      inputEl.val(newSliderValue);
      inputEl.change();
    });

    inputEl.on('input', (e) => {
      const newInputValue = $(e.target).val();
      slider.val(newInputValue);
    });
  }
}
