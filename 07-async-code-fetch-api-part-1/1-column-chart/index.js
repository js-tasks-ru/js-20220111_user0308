import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ColumnChart {
  chartHeight = 50;
  subElements = {};

  constructor({
    value = 0,
    data = [],
    url = '',
    range = {
      from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      to: new Date(),
    },
    label = '',
    link = '',
    formatHeading = data => data
  } = {}) {
    this.data = data;
    this.title = label;
    this.formatHeading = formatHeading;
    this.value = this.formatHeading(value);
    this.link = link;
    this.url = new URL(url, BACKEND_URL);
    this.url.searchParams.set('from', range.from.toISOString());
    this.url.searchParams.set('to', range.to.toISOString());

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
             ${this.getCharCols(this.data)}
          </div>
        </div>
      </div>
    `;
  }

  getCharCols(data) {
    this.maxVal = Math.max(1, ...data);
    return data.map(value => '<div style="--value: ' + Math.floor(this.chartHeight * value / this.maxVal) + '" data-tooltip="' + Math.round(value / this.maxVal * 100) + '%"></div>').join('');
  }

  render() {
    const element = document.createElement('div');
    element.innerHTML = this.getTemplate();
    element.querySelectorAll('[data-element]').forEach(element => this.subElements[element.dataset.element] = element);
    this.element = element.firstElementChild;

    this.update();
  }

  async update(from = '', to = '') {
    if(from) this.url.searchParams.set('from', from.toISOString());
    if(to) this.url.searchParams.set('to', to.toISOString());

    try {
      const json = await fetchJson(this.url);
      const data = Object.values(json);
      this.value = '';
      if (data.length) {
        this.value = this.formatHeading(data.reduce((previousValue, currentValue) => previousValue + currentValue));
      }
      this.subElements.header.innerHTML = this.value;
      this.subElements.body.innerHTML = this.getCharCols(data);

      data.length ? this.element.classList.remove('column-chart_loading') : this.element.classList.add('column-chart_loading');

      return json;
    }
    catch (err) {
      console.error(err);
      this.element.classList.add('column-chart_loading');
    }
  }

  remove() {
    if(this.element) this.element.remove();
  }

  destroy() {
    this.remove();
    this.element = null;
    this.subElements = {};
  }
}