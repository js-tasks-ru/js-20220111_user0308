export default class SortableTable {
  subElements = {};

  constructor(headersConfig, {
    data = [],
    sorted = {}
  } = {}) {
    this.headersConfig = headersConfig;
    this.data = data;
    this.sorted = [sorted.id, sorted.order].filter(item => item);
    this.isSortLocally = true;

    this.render();
    this.addEventListeners();
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
    return this.headersConfig.map(item => {
      return `
      <div class="sortable-table__cell" data-id="${item.id}" data-sortable="${item.sortable}">
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
    return this.headersConfig.map(col => {
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

    if (this.sorted.length) {
      this.sort(...this.sorted);
    }
  }

  sort(fieldValue, orderValue) {
    if (this.isSortLocally) {
      this.sortOnClient(fieldValue, orderValue);
    } else {
      this.sortOnServer();
    }
  }

  sortOnClient(fieldValue, orderValue) {
    const curCell = this.subElements.header.querySelector('[data-id="' + fieldValue + '"]');
    const sortType = this.headersConfig.filter(item => item.id === fieldValue)[0].sortType;
    const direction = {
      'asc': 1,
      'desc': -1
    };

    this.data.sort(sortTable);

    this.subElements.body.innerHTML = this.getBodyTemplate();

    curCell.dataset.order = orderValue;
    curCell.append(this.subElements.arrow);

    function sortTable(a, b) {
      switch (sortType) {
      case 'string':
        return direction[orderValue] * a[fieldValue].localeCompare(b[fieldValue], ['ru', 'en'], { caseFirst: 'upper' });
      case 'number':
      default:
        return direction[orderValue] * (a[fieldValue] - b[fieldValue]);
      }
    }
  }

  sortOnServer() {
    // Get sorted data from server
  }

  addEventListeners() {
    this.subElements.header.addEventListener('pointerdown', this.handleHeaderClick);
  }

  removeEventListeners() {
    this.subElements.header.removeEventListener('pointerdown', this.handleHeaderClick);
  }

  handleHeaderClick = event => {
    const target = event.target.closest('[data-sortable="true"]');
    if(!target || !this.subElements.header.contains(target)) return;

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
