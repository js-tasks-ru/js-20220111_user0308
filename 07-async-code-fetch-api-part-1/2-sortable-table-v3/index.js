import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class SortableTable {
  subElements = {};
  loadingStep = 30;
  readyToLoad = true;
  prevScroll = 0;

  constructor(headersConfig, {
    data = [],
    sorted = {},
    url = '',
    isSortLocally = false,
  } = {}) {
    this.headersConfig = headersConfig;
    this.data = data;
    this.sorted = [sorted.id, sorted.order].filter(item => item);
    this.isSortLocally = isSortLocally;

    this.url = new URL(url, BACKEND_URL);
    this.url.searchParams.set('_start', '0');
    this.url.searchParams.set('_end', this.loadingStep.toString());

    this.render();
  }

  getTemplate() {
    return `
    <div class="sortable-table sortable-table_loading">
      <div data-element="header" class="sortable-table__header sortable-table__row">
        ${this.getHeaderTemplate()}
      </div>
      
      <div data-element="body" class="sortable-table__body">
        ${this.getBodyTemplate()}
      </div>
      
      <div data-element="loading" class="loading-line sortable-table__loading-line"></div>
  
      <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
        <div>
          <p>No products satisfy your filter criteria</p>
          <button type="button" class="button-primary-outline">Reset all filters</button>
        </div>
      </div>
    </div>
    `;
  }

  getHeaderTemplate() {
    return this.headersConfig.map(item => {
      return `
      <div class="sortable-table__cell" data-id="${item.id}" data-sortable="${item.sortable}">
        <span>${item.title}</span>
      </div>
      `;
    }).join('');
  }

  getBodyTemplate() {
    return this.data.map(item => {
      return `
      <a href="/products/${item.id}" class="sortable-table__row">
        ${this.getBodyRow(item)}
      </a>
      `;
    }).join('');
  }

  getBodyRow(item) {
    return this.headersConfig.map(col => {
      return col.template ? col.template(item[col.id]) : `<div class="sortable-table__cell">${item[col.id]}</div>`;
    }).join('');
  }

  async render() {
    const element = document.createElement('div');

    element.innerHTML = '<span data-element="arrow" class="sortable-table__sort-arrow"><span class="sort-arrow"></span></span>';

    this.subElements['arrow'] = element.firstElementChild;

    element.innerHTML = this.getTemplate();

    element.querySelectorAll('[data-element]').forEach(element => this.subElements[element.dataset.element] = element);

    this.element = element.firstElementChild;

    this.addEventListeners();

    if (this.sorted.length) {
      this.setSortParams(...this.sorted);
    }

    try {
      await this.loadData();
      this.addBodyRows();
    }
    catch (err) {
      console.log(err);
    }
  }
  
  setSortParams(id, order) {
    this.url.searchParams.set('_sort', id);
    this.url.searchParams.set('_order', order);

    const sortHeaderEl = this.subElements.header.querySelector('[data-id="' + id + '"]');
    sortHeaderEl.dataset.order = order;
    sortHeaderEl.append(this.subElements.arrow);
  }

  sort(id, order) {
    this.setSortParams(id, order);

    if (this.isSortLocally) {
      this.sortOnClient(id, order);
    } else {
      this.sortOnServer(id, order);
    }
  }

  sortOnClient(id, order) {
    this.setLoadingState();
    this.subElements.body.innerHTML = '';

    const sortType = this.headersConfig.filter(item => item.id === id)[0].sortType;
    const direction = {
      'asc': 1,
      'desc': -1
    };

    this.data.sort(sortTable);
    this.addBodyRows();

    function sortTable(a, b) {
      switch (sortType) {
      case 'string':
        return direction[order] * a[id].localeCompare(b[id], ['ru', 'en'], { caseFirst: 'upper' });
      case 'number':
      default:
        return direction[order] * (a[id] - b[id]);
      }
    }
  }

  sortOnServer(id, order) {
    this.prevScroll = 0;
    this.setLoadingState();
    this.subElements.body.innerHTML = '';

    this.url.searchParams.set('_start', '0');
    this.url.searchParams.set('_end', this.loadingStep);

    this.loadData()
      .then(response => {
        this.data = response;
        this.addBodyRows();
      })
      .catch(err => err);
  }

  addBodyRows() {
    this.subElements.body.insertAdjacentHTML('beforeend', this.getBodyTemplate());

    this.data.length ? this.removeLoadingState() : this.setLoadingState();
  }

  async loadData() {
    this.data = await fetchJson(this.url);

    return this.data;
  }

  handleScroll = () => {
    const currentScroll = window.scrollY;

    if (this.readyToLoad && currentScroll > this.prevScroll && window.innerHeight + window.scrollY + 300 > document.body.scrollHeight) {
      this.setLoadingState();

      this.prevScroll = currentScroll;
      this.readyToLoad = false;

      const newStart = +this.url.searchParams.get('_end') + 1;
      const newEnd = newStart + this.loadingStep;

      this.url.searchParams.set('_start', newStart.toString());
      this.url.searchParams.set('_end', newEnd.toString());

      this.loadData()
        .then(response => {
          if (response.length) {
            this.addBodyRows();
          }
          else {
            this.removeLoadingState();
          }

          this.readyToLoad = true;
        })
        .catch(err => err);
    }
  }

  setLoadingState() {
    this.element.classList.add('sortable-table_loading');
  }

  removeLoadingState() {
    this.element.classList.remove('sortable-table_loading');
  }

  addEventListeners() {
    this.subElements.header.addEventListener('pointerdown', this.handleHeaderClick);
    document.addEventListener('scroll', this.handleScroll);
  }

  removeEventListeners() {
    document.removeEventListener('scroll', this.handleScroll);
  }

  handleHeaderClick = event => {
    const target = event.target.closest('[data-sortable="true"]');

    if (!target || !this.subElements.header.contains(target)) return;

    const sortId = target.dataset.id;
    const sortOrder = target.dataset.order === 'desc' ? 'asc' : 'desc';

    this.sort(sortId, sortOrder);
  }

  remove() {
    if (this.element) {
      this.removeEventListeners();
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
    this.subElements = {};
  }
}
