class Tooltip {
  static currentTooltip = null;

  constructor() {
    if(Tooltip.currentTooltip) return Tooltip.currentTooltip;

    Tooltip.currentTooltip = this;
  }

  initialize() {
    this.addEventListeners();
  }

  addEventListeners() {
    document.addEventListener('pointerover', this.showTooltip);
    document.addEventListener('pointerout', this.hideTooltip);
  }

  removeEventListeners() {
    document.removeEventListener('pointerover', this.showTooltip);
    document.removeEventListener('pointerout', this.hideTooltip);
    document.removeEventListener('pointermove', this.moveTooltip);
  }

  render() {
    const element = document.createElement('div');

    element.innerHTML = `
      <div class="tooltip">${this.tooltipText}</div>
    `;

    this.element = element.firstElementChild;
    document.body.append(this.element);
  }

  showTooltip = event => {
    const target = event.target.closest('[data-tooltip]');
    if(!target) return;

    this.tooltipText = target.dataset.tooltip;

    this.render();

    document.addEventListener('pointermove', this.moveTooltip);
  }

  hideTooltip = event => {
    const target = event.target.closest('[data-tooltip]');
    if(!target) return;

    if(this.element) {
      this.element.remove();
    }

    document.removeEventListener('pointermove', this.moveTooltip);
  }

  moveTooltip = event => {
    const boundingBox = this.element.getBoundingClientRect();
    const offset = 10;
    const x = event.clientX;
    const y = event.clientY;

    if(x + boundingBox.width + offset > window.innerWidth - offset) {
      this.element.style.right = offset + 'px';
      this.element.style.left = 'auto';
    }
    else {
      this.element.style.right = 'auto';
      this.element.style.left = x + offset + 'px';
    }

    if(y + boundingBox.height + offset > window.innerHeight - offset) {
      this.element.style.top = 'auto';
      this.element.style.bottom = offset + 16 + 'px';
    }
    else {
      this.element.style.top = y + offset + 'px';
      this.element.style.bottom = 'auto';
    }
  }

  remove() {
    this.removeEventListeners();

    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
  }
}

export default Tooltip;
