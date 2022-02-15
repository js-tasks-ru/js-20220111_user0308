import escapeHtml from './utils/escape-html.js';
import fetchJson from './utils/fetch-json.js';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ProductForm {
  subElements = {};
  prodUrl = new URL('/api/rest/products', BACKEND_URL);

  constructor (productId = null) {
    this.productId = productId;
  }

  getData() {
    const categoriesUrl = new URL('/api/rest/categories', BACKEND_URL);
    const prodUrl = new URL(this.prodUrl);

    categoriesUrl.searchParams.set('_sort', 'weight');
    categoriesUrl.searchParams.set('_refs', 'subcategory');

    if (this.productId) {
      prodUrl.searchParams.set('id', this.productId);
    }

    return Promise.all([
      fetchJson(categoriesUrl),
      this.productId ? fetchJson(prodUrl) : []
    ]);
  }

  async render () {
    const [cat, prod] = await this.getData();
    this.categories = cat;
    this.productData = prod[0];

    const element = document.createElement('div');

    element.innerHTML = this.getTemplate();
    element.querySelectorAll('[data-element]').forEach(element => this.subElements[element.dataset.element] = element);

    if (this.productData) {
      this.populateData();
    }

    this.element = element.firstElementChild;

    this.initEventListeners();

    return this.element;
  }

  getTemplate() { // adding ids to the template because tests 2 and 3 fetch data from the form by id
    return `
    <div class="product-form">
      <form data-element="productForm" class="form-grid">
        <div class="form-group form-group__half_left">
          <fieldset>
            <label class="form-label">Название товара</label>
            <input required="" type="text" name="title" class="form-control" placeholder="Название товара" id="title">
          </fieldset>
        </div>
        <div class="form-group form-group__wide">
          <label class="form-label">Описание</label>
          <textarea required="" class="form-control" name="description" data-element="productDescription" placeholder="Описание товара" id="description"></textarea>
        </div>
        <div class="form-group form-group__wide" data-element="sortable-list-container">
          <label class="form-label">Фото</label>
          <div data-element="imageListContainer">
            <ul class="sortable-list"></ul>
          </div>
          <button type="button" name="uploadImage" class="button-primary-outline"><span>Загрузить</span></button>
        </div>
        <div class="form-group form-group__half_left">
          <label class="form-label">Категория</label>
          <select class="form-control" name="subcategory" id="subcategory">
            ${this.getSubCategories()}
          </select>
        </div>
        <div class="form-group form-group__half_left form-group__two-col">
          <fieldset>
            <label class="form-label">Цена ($)</label>
            <input required="" type="number" name="price" class="form-control" placeholder="100" id="price">
          </fieldset>
          <fieldset>
            <label class="form-label">Скидка ($)</label>
            <input required="" type="number" name="discount" class="form-control" placeholder="0" id="discount">
          </fieldset>
        </div>
        <div class="form-group form-group__part-half">
          <label class="form-label">Количество</label>
          <input required="" type="number" class="form-control" name="quantity" placeholder="1" id="quantity">
        </div>
        <div class="form-group form-group__part-half">
          <label class="form-label">Статус</label>
          <select class="form-control" name="status" id="status">
            <option value="1">Активен</option>
            <option value="0">Неактивен</option>
          </select>
        </div>
        <div class="form-buttons">
          <button type="submit" name="save" class="button-primary-outline">
            Сохранить товар
          </button>
        </div>
      </form>
    </div>
    `;
  }

  getImages () {
    return this.productData['images'].map(({url, source}) => this.getImage(url, source)).join('');
  }

  getImage(url, name) {
    return `
        <li class="products-edit__imagelist-item sortable-list__item">
          <input type="hidden" name="url" value="${url}">
          <input type="hidden" name="source" value="${name}">
          <span>
            <img src="icon-grab.svg" data-grab-handle alt="grab">
            <img class="sortable-table__cell-img" alt="Image" src="${url}">
            <span>${name}</span>
          </span>
          <button type="button">
            <img src="icon-trash.svg" data-delete-handle alt="delete">
          </button>
        </li>
      `;
  }

  getSubCategories () {
    function getCurrentSubCategories(cat) {
      if (!cat.hasOwnProperty('subcategories')) {
        return [cat.title, cat.id];
      }
      else {
        const currentTitle = cat.title;

        return cat.subcategories.map(item => {
          let [title, id] = getCurrentSubCategories(item).flat();
          return [currentTitle + ' > ' + title, id];
        });
      }
    }

    return this.categories.map(item => getCurrentSubCategories(item))
      .flat()
      .map(([title, id]) => `<option value="${id}">${title}</option>`)
      .join('');
  }

  populateData() {
    this.subElements['productForm'].querySelectorAll('.form-control').forEach(item => {
      item.value = this.productData[item.name];
    });

    this.subElements['imageListContainer'].querySelector('ul').innerHTML = this.getImages();
  }

  formSubmit = async (event) => {
    event.preventDefault();

    const formData = {};
    let currentImg = {};

    if (this.productId) formData.id = this.productId;

    formData.images = [];

    for (const [key, value] of new FormData(this.subElements['productForm'])) {
      if (key !== 'url' && key !== 'source') {
        formData[key] = +value || value === '0' ? +value : escapeHtml(value);
      }
      else {
        currentImg[key] = value;
      }

      if (currentImg.hasOwnProperty('source')) {
        formData.images.push(currentImg);

        currentImg = {};
      }
    }

    fetchJson(this.prodUrl, {
      method: this.productId ? 'PATCH' : 'PUT',
      body: JSON.stringify(formData),
      headers: {
        'Content-Type': 'application/json; charset=UTF-8'
      },
    })
    .then(response => {
      this.save();
    })
    .catch(err => console.log(err));
  }

  uploadImage = async (event) => {
    const button = event.target.closest('button');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = () => {
      const formData = new FormData();
      const file = input.files[0];

      formData.append('image', file);

      button.classList.add('is-loading');

      fetchJson('https://api.imgur.com/3/image/', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: 'Client-ID ' + IMGUR_CLIENT_ID
        },
        referrer: ''
      })
      .then(response => {
        this.subElements['imageListContainer'].querySelector('ul').insertAdjacentHTML('beforeend', this.getImage(response.data.link, file.name));
      })
      .catch(err => console.log(err))
      .finally(() => {
        input.remove();
        button.classList.remove('is-loading');
      });
    };

    input.click();
  }

  save() {
    const event = new CustomEvent(this.productId ? 'product-updated' : 'product-saved', {
      bubbles: true,
      detail: {
      }
    });

    this.element.dispatchEvent(event);
  }

  initEventListeners () {
    this.subElements['productForm'].addEventListener('submit', this.formSubmit);
    this.subElements['productForm'].querySelector('[name="uploadImage"]').addEventListener('click', this.uploadImage);
  }

  remove () {
    this.element.remove();
  }

  destroy() {
    this.remove();
    this.subElements = null;
  }
}
