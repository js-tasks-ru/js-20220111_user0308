export default class ColumnChart {
  chartHeight = 50;
  subElements = {};

  constructor({
    data = [],
    label = '',
    value = 0,
    link = '',
    formatHeading = data => data
  } = {}) {
    this.data = data;
    this.title = label;
    this.value = formatHeading(value);
    this.link = link;
    this.render();
  }

  getTemplate () {
    return `
      <div class="column-chart${!this.data.length ? ' column-chart_loading' : ''}" style="--chart-height: ${this.chartHeight}">
        <div class="column-chart__title">
          Total ${this.title}
          ${this.link !== '' ? '<a href="' + this.link + '" class="column-chart__link">View all</a>' : ''}
        </div>
        <div class="column-chart__container">
          <div data-element="header" class="column-chart__header">${this.value}</div>
          <div data-element="body" class="column-chart__chart">
             ${this.getCharCols()}
          </div>
        </div>
      </div>
    `
  }

  getCharCols() {
    this.maxVal = Math.max(1, ...this.data);
    return this.data.map(value => '<div style="--value: ' + Math.floor(this.chartHeight * value / this.maxVal) + '" data-tooltip="' + Math.round(value / this.maxVal * 100) + '%"></div>').join('');
  }

  render() {
    const element = document.createElement('div');
    element.innerHTML = this.getTemplate();
    element.querySelectorAll('[data-element]').forEach(element => this.subElements[element.dataset.element] = element);
    this.element = element.firstElementChild;
  }

  update(newData = []) {
    this.data = newData;
    this.subElements.body.innerHTML = this.getCharCols();
    this.data.length ? this.element.classList.remove('column-chart_loading') : this.element.classList.add('column-chart_loading');
  }

  remove () {
    this.element.remove();
  }

  destroy() {
    this.remove();
    this.element = null;
    this.subElements = {};
  }
}
