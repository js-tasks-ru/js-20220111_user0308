export default class SortableTable {
  subElements = {};

  constructor(headerConfig = [], data = []) {
    this.headerConfig = headerConfig;
    this.data = data;
    this.colsSortType = {};

    this.headerConfig.forEach(col => {
      if (col.sortable) this.colsSortType[col.id] = col.sortType;
    });

    this.render();
  }

  getTemplate() {
    return `
    <div class="sortable-table">
      <div data-element="header" class="sortable-table__header sortable-table__row">
        ${this.getHeaderTemplate()}
      </div>
      
      <div data-element="body" class="sortable-table__body">
        ${this.getBodyTemplate()}
      </div>
      
      <div data-element="loading" class="loading-line sortable-table__loading-line"></div>
  
      <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
        <div>
          <p>No products satisfies your filter criteria</p>
          <button type="button" class="button-primary-outline">Reset all filters</button>
        </div>
      </div>
    </div>
    `
  }

  getHeaderTemplate() {
    return this.headerConfig.map(item => {
      return `
      <div class="sortable-table__cell" data-id="${item.id}" data-sortable="${item.sortable}" data-order="">
        <span>${item.title}</span>
      </div>
      `
    }).join('');
  }

  getBodyTemplate() {
    return this.data.map(item => {
      return `
      <a href="/products/${item.id}" class="sortable-table__row">
        ${this.getBodyRow(item)}
      </a>
      `
    }).join('');
  }

  getBodyRow(item) {
    return this.headerConfig.map(col => {
      return col.template ? col.template(item[col.id]) : `<div class="sortable-table__cell">${item[col.id]}</div>`;
    }).join('');
  }

  render() {
    const element = document.createElement('div');

    element.innerHTML = '<span data-element="arrow" class="sortable-table__sort-arrow"><span class="sort-arrow"></span></span>';

    this.subElements['arrow'] = element.firstElementChild;

    element.innerHTML = this.getTemplate();

    element.querySelectorAll('[data-element]').forEach(element => this.subElements[element.dataset.element] = element);

    this.element = element.firstElementChild;
  }

  sort(fieldValue, orderValue) {
    const curCell = this.subElements.header.querySelector('[data-id="' + fieldValue + '"]');
    const direction = orderValue === 'desc' ? -1 : 1;
    const sortType = this.colsSortType[fieldValue];

    this.data.sort(sortTable);

    this.subElements.body.innerHTML = this.getBodyTemplate();

    curCell.dataset.order = orderValue;
    curCell.append(this.subElements.arrow);

    function sortTable(a, b) {
      if(sortType === 'string') return direction * a[fieldValue].localeCompare(b[fieldValue], ['ru', 'en'], { caseFirst: 'upper' });
      if(sortType === 'number') return direction * (a[fieldValue] - b[fieldValue]);
    }
  }

  remove() {
    if (this.element) this.element.remove();
  }

  destroy() {
    this.remove();
    this.element = null;
    this.subElements = {};
  }
}

