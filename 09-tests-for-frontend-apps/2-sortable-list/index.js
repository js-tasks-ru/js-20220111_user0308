export default class SortableList {
  constructor({
    items = []
  } = {}) {
    this.items = [...items];
    this.render();
    this.initEventListeners();
  }

  render() {
    const element = document.createElement('ul');
    element.classList.add('sortable-list');
    this.buildList(element);
    this.element = element;
  }

  buildList(element) {
    this.items.forEach(item => {
      item.classList.add('sortable-list__item');

      if (!item.querySelector('[data-grab-handle]')) item.insertAdjacentHTML('afterbegin', '<span data-grab-handle />');
      if (!item.querySelector('[data-delete-handle]')) item.insertAdjacentHTML('beforeend', '<span data-delete-handle />');

      element.append(item);
    });
  }

  getSiblings() {
    this.prevEl = this.plhItem.previousElementSibling;
    this.nextEl = this.plhItem.nextElementSibling;

    const result = [];

    if (this.prevEl) {
      const box = this.prevEl.getBoundingClientRect();

      result.push(
        {
          'el': this.prevEl,
          'top': box.top,
          'bottom': box.bottom,
          'direction': 0,
        }
      );
    }

    if (this.nextEl !== this.currentItem) {
      const box = this.nextEl.getBoundingClientRect();

      result.push(
        {
          'el': this.nextEl,
          'top': box.top,
          'bottom': box.bottom,
          'direction': 1,
        }
      );
    }

    return result;
  }

  handlePointerDown = event => {
    const target = event.target.closest('[data-delete-handle], [data-grab-handle]');

    if (!target) return;

    const { grabHandle, deleteHandle } = target.dataset;
    const element = target.closest('.sortable-list__item');

    if (typeof grabHandle !== 'undefined') {
      this.currentItem = element;

      this.plhItem = document.createElement('li');
      this.plhItem.classList.add('sortable-list__item', 'sortable-list__placeholder');
      this.plhItem.style.width = this.currentItem.clientWidth + 'px';
      this.plhItem.style.height = this.currentItem.clientHeight + 'px';

      this.currentItem.after(this.plhItem);

      const { left: x, top: y } = this.currentItem.getBoundingClientRect();

      this.shiftX = event.clientX - x;
      this.shiftY = event.clientY - y;

      this.currentItem.style.width = this.currentItem.clientWidth + 'px';
      this.currentItem.style.height = this.currentItem.clientHeight + 'px';
      this.currentItem.style.left = event.clientX - this.shiftX + 'px';
      this.currentItem.style.top = event.clientY - this.shiftY + 'px';
      this.currentItem.classList.add('sortable-list__item_dragging');

      this.element.append(this.currentItem);

      this.currentPrevNext = this.getSiblings();

      document.addEventListener('pointermove', this.handlePointerMove);
    }
    else if (typeof deleteHandle !== 'undefined') {
      element.remove();
    }
  }

  handlePointerMove = event => {
    const x = event.clientX;
    const y = event.clientY;

    this.currentItem.style.left = x - this.shiftX + 'px';
    this.currentItem.style.top = y - this.shiftY + 'px';

    let newPosition = this.currentPrevNext.filter(item => item.top < y && item.bottom > y)[0];

    if (newPosition) {
      newPosition.direction ? newPosition.el.after(this.plhItem) : newPosition.el.before(this.plhItem);

      this.currentPrevNext = this.getSiblings();
    }
  }

  handlePointerUp = event => {
    const target = event.target.closest('[data-grab-handle]');

    if (!target) return;

    document.removeEventListener('pointermove', this.handlePointerMove);

    this.currentItem.classList.remove('sortable-list__item_dragging');
    this.currentItem.style = '';
    this.plhItem.after(this.currentItem);
    this.plhItem.remove();
  }

  handleDragStart = event => {
    if (event.target.closest('[data-grab-handle]')) {
      event.preventDefault();

      // Adding this ^ instead of v. Is this the right way to cancel dragstart event?
      // el.ondragstart = function() {
      //   return false;
      // };
    }
  }

  initEventListeners () {
    this.element.addEventListener('dragstart', this.handleDragStart);
    document.addEventListener('pointerdown', this.handlePointerDown);
    document.addEventListener('pointerup', this.handlePointerUp);
  }

  removeEventListeners() {
    document.removeEventListener('pointerdown', this.handlePointerDown);
    document.removeEventListener('pointerup', this.handlePointerUp);
    document.removeEventListener('pointermove', this.handlePointerMove);
  }

  remove () {
    this.element.remove();
  }

  destroy() {
    this.remove();
    this.removeEventListeners();
  }

}
