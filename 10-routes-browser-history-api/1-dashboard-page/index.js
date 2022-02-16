// import RangePicker from './components/range-picker/src/index.js';
import RangePicker from '../../08-forms-fetch-api-part-2/2-range-picker/index.js';
// import SortableTable from './components/sortable-table/src/index.js';
import SortableTable from '../../07-async-code-fetch-api-part-1/2-sortable-table-v3/index.js';
// import ColumnChart from './components/column-chart/src/index.js';
import ColumnChart from '../../07-async-code-fetch-api-part-1/1-column-chart/index.js';
import header from './bestsellers-header.js';

import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru/';

export default class Page {
  subElements = {};
  defaultFrom = this.getDefaultFrom();
  defaultTo = new Date();
  components = {};

  getDefaultFrom () {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    today.setMonth(today.getMonth() - 1);

    return new Date(today);
  }

  async render () {
    const element = document.createElement('div');

    element.innerHTML = this.getTemplate();

    this.getSubElements(element);

    this.element = element.firstElementChild;

    this.initComponents();
    this.renderComponents();
    this.initEventListeners();

    return this.element;
  }

  getSubElements (element) {
    element.querySelectorAll('[data-element]').forEach(element => this.subElements[element.dataset.element] = element);
  }

  getTemplate () {
    return `
      <div class="dashboard full-height flex-column" data-element="dashboard">
        <div class="content__top-panel">
          <h2 class="page-title">Панель управления</h2>
          <div data-element="rangePicker"></div>
        </div>
        <div class="dashboard__charts" data-element="charts">
          <div id="orders" class="dashboard__chart_orders" data-element="ordersChart"></div>
          <div id="sales" class="dashboard__chart_sales" data-element="salesChart"></div>
          <div id="customers" class="dashboard__chart_customers" data-element="customersChart"></div>
        </div>
        <h3 class="block-title">Лидеры продаж</h3>
        <div data-element="sortableTable"></div>
      </div>
    `;
  }

  initComponents() {
    const rangePicker = new RangePicker({
      from: this.defaultFrom,
      to: this.defaultTo
    });

    const ordersChart = new ColumnChart({
      url: 'api/dashboard/orders',
      range: {
        from: this.defaultFrom,
        to: this.defaultTo
      },
      label: 'orders',
      link: '#'
    });

    const salesChart = new ColumnChart({
      url: 'api/dashboard/sales',
      range: {
        from: this.defaultFrom,
        to: this.defaultTo
      },
      label: 'sales',
      formatHeading: data => `$${data}`
    });

    const customersChart = new ColumnChart({
      url: 'api/dashboard/customers',
      range: {
        from: this.defaultFrom,
        to: this.defaultTo
      },
      label: 'customers',
    });

    const tableUrl = new URL('api/dashboard/bestsellers', BACKEND_URL);
    tableUrl.searchParams.set('from', this.defaultFrom.toISOString());
    tableUrl.searchParams.set('to', this.defaultTo.toISOString());

    const sortableTable = new SortableTable(header, {
      url: tableUrl.pathname + tableUrl.search,
      isSortLocally: true,
      sorted: {
        id: header.find(item => item.sortable).id,
        order: 'asc'
      }
    });

    this.components = {
      rangePicker,
      ordersChart,
      salesChart,
      customersChart,
      sortableTable
    };
  }

  renderComponents() {
    Object.keys(this.components).forEach(component => {
      const target = this.subElements[component];
      const { element } = this.components[component];

      target.append(element);
    });
  }

  updateComponents = event => {
    const { from, to } = event.detail;

    Object.keys(this.components).forEach(component => {
      if (component !== 'rangePicker') {
        this.components[component].update(from, to);
      }
    });
  }

  initEventListeners () {
    document.addEventListener('date-select', this.updateComponents);
  }

  removeEventListeners () {
    document.removeEventListener('date-select', this.updateComponents);
  }

  remove () {
    this.element.remove();
  }

  destroy() {
    this.remove();
    this.subElements = {};

    this.removeEventListeners();

    Object.keys(this.components).forEach(component => {
      this.components[component].destroy();
    });
  }
}