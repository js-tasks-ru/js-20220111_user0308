export default class RangePicker {
  subElements = {};
  currentShift = 0;
  newFrom = null;
  newTo = null;
  currentTime = Date.now() - new Date().setHours(0, 0, 0, 0);
  controlsAdded = false;
  weekDays = '';

  constructor({
    from = new Date(Date.now() - 2.628e+9), // One month back
    to = new Date(),
  } = {}) {
    this.from = from;
    this.to = to;

    this.origFrom = this.from;
    this.origTo = this.to;

    this.render();
    this.initEventListeners();
  }

  getTemplate () {
    return `
    <div class="rangepicker">
      <div class="rangepicker__input" data-element="input">
        ${this.getInput()}
      </div>
      <div class="rangepicker__selector" data-element="selector"></div>
    </div>
    `;
  }

  getControls() {
    return `
      <div class="rangepicker__selector-arrow"></div>
      <div class="rangepicker__selector-control-left"></div>
      <div class="rangepicker__selector-control-right"></div>
    `;
  }

  getInput () {
    return `
      <span data-element="from">${this.dateToString(this.from)}</span> -
      <span data-element="to">${this.dateToString(this.to)}</span>
    `;
  }

  getSelector (to, shift = 0) {
    this.currentShift = shift;

    return `
    ${this.getCalendar(to, this.currentShift + 1)}
    ${this.getCalendar(to, this.currentShift)}
    `;
  }

  getCalendar(date, shift = 0) {
    const month = new Date(date);
    month.setMonth(month.getMonth() - shift);
    month.setDate(1);
    month.setHours(0, 0, 0, 0);
    month.setMilliseconds(this.currentTime);

    const monthName = month.toLocaleString('ru', { month: 'long' });

    return `
    <div class="rangepicker__calendar">
          <div class="rangepicker__month-indicator">
            <time datetime="${monthName}">${monthName}</time>
          </div>
          <div class="rangepicker__day-of-week">
            ${this.getDaysOfWeek(month)}
          </div>
          <div class="rangepicker__date-grid">
            ${this.getDaysInMonth(month, this.from, this.to, month.getDay())}
          </div>
        </div>
    `;
  }

  getDaysOfWeek(month) {
    if (this.weekDays) return this.weekDays;

    const date = new Date(month);
    let weekdays = '';

    for (let i = 0; i < 7; i++) {
      date.setDate(date.getDate() - date.getDay() + i + 1);

      let weekday = date.toLocaleString('ru', {weekday: 'short'});
      weekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      weekdays += `<div>${weekday}</div>`;
    }

    this.weekDays = weekdays;

    return this.weekDays;
  }

  getDaysInMonth(month, from, to, startFrom) {
    const date = new Date(month);
    const days = [];
    const timeZoneOffset = month.getTimezoneOffset() * 6e4;

    if (!startFrom) startFrom = 7;

    while (date.getMonth() === month.getMonth()) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }

    return days.map((item, index) => {
      const dateClass = this.compareDates(item, from, to);
      return `<button type="button" class="rangepicker__cell${dateClass ? ` rangepicker__selected-${dateClass}` : ''}" data-value="${new Date(item.getTime() - timeZoneOffset).toISOString()}"${!index ? `style="--start-from: ${startFrom}"` : ''}>${item.getDate()}</button>`;
    }).join('');
  }

  compareDates(d, f, t) {
    let result = false;

    const date = new Date(d);
    const from = new Date(f);
    const to = new Date(t);

    date.setHours(0, 0, 0, 0);
    from.setHours(0, 0, 0, 0);
    to.setHours(0, 0, 0, 0);

    if (date.getTime() === from.getTime()) {
      result = 'from';
    }
    else if (date.getTime() === to.getTime()) {
      result = 'to';
    }
    else if (date > from && date < to) {
      result = 'between';
    }

    return result;
  }

  sortDates(d1, d2) {
    if (d2 > d1) {
      this.to = d2;
      this.from = d1;
    }
    else {
      this.to = d1;
      this.from = d2;
    }
  }

  render() {
    const element = document.createElement('div');

    element.innerHTML = this.getTemplate();

    element.querySelectorAll('[data-element]').forEach(element => this.subElements[element.dataset.element] = element);

    this.element = element.firstElementChild;
  }

  dateToString(date) {
    return date.toLocaleDateString('ru');
  }

  closeAndUpdate() {
    if (!this.newTo) {
      this.from = this.origFrom;
      this.to = this.origTo;
    }
    else {
      this.origFrom = this.from;
      this.origTo = this.to;
    }

    this.element.classList.remove('rangepicker_open');
    this.subElements['input'].innerHTML = this.getInput();

    this.currentShift = 0;
    this.newFrom = null;
    this.newTo = null;

    const event = new CustomEvent('date-select', {
      bubbles: true,
      detail: {
        from: this.from,
        to: this.to
      }
    });

    this.element.dispatchEvent(event);
  }

  removeCalendars() {
    const [leftCalendar, rightCalendar] = this.subElements['selector'].querySelectorAll('.rangepicker__calendar');
    if (leftCalendar) leftCalendar.remove();
    if (rightCalendar) rightCalendar.remove();
  }

  handleInputClick = event => {
    const target = event.target.closest('.rangepicker__input');

    if (!target) return;

    this.currentShift = 0;
    this.newFrom = null;
    this.newTo = null;

    this.element.classList.toggle('rangepicker_open');

    if (this.element.classList.contains('rangepicker_open')) {
      this.removeCalendars();
      if(!this.controlsAdded) {
        this.controlsAdded = true;
        this.subElements['selector'].insertAdjacentHTML('afterbegin', this.getControls());
      }
      this.subElements['selector'].insertAdjacentHTML('beforeend', this.getSelector(this.to));
    }
  }

  handleSelectorClick = event => {
    const target = event.target;

    if (target.closest('.rangepicker__selector-control-left')) {
      this.removeCalendars();
      this.subElements['selector'].insertAdjacentHTML('beforeend', this.getSelector(this.to, ++this.currentShift));
    }
    else if (target.closest('.rangepicker__selector-control-right')) {
      this.removeCalendars();
      this.subElements['selector'].insertAdjacentHTML('beforeend', this.getSelector(this.to, --this.currentShift));
    }
    else if (target.closest('.rangepicker__cell')) {
      const currentButton = target.closest('.rangepicker__cell');
      const newDate = target.closest('.rangepicker__cell').dataset.value;

      if (!this.newFrom) {
        const selectedDates = this.element.querySelectorAll('[class*="rangepicker__selected-"]');
        const [leftCalendar] = this.subElements['selector'].querySelectorAll('.rangepicker__calendar');
        this.newFrom = new Date(newDate);
        this.from = this.newFrom;
        this.to = this.newFrom;

        if (leftCalendar.contains(target)) {
          this.currentShift = -1;
        }

        selectedDates.forEach(el => el.classList.remove('rangepicker__selected-from', 'rangepicker__selected-to', 'rangepicker__selected-between'));
        currentButton.classList.add('rangepicker__selected-from');
      }
      else {
        const allDays = this.element.querySelectorAll('.rangepicker__cell');
        this.newTo = new Date(newDate);
        this.to = this.newTo;

        this.sortDates(this.from, this.to);

        for (const day of allDays) {
          const {value} = day.dataset;
          const date = new Date(value);

          if (value === this.from.toISOString()) {
            day.classList.add('rangepicker__selected-from');
          }
          else if (value === this.to.toISOString()) {
            day.classList.add('rangepicker__selected-to');

            break;
          }
          else if (date > this.from) {
            day.classList.add('rangepicker__selected-between');
          }
        }

        this.closeAndUpdate();
      }
    }
  }

  handleDocumentClick = event => {
    const target = event.target;

    if (target.closest('.rangepicker') || !this.element.classList.contains('rangepicker_open')) return;

    this.closeAndUpdate();
  }

  initEventListeners () {
    const {input, selector} = this.subElements;
    input.addEventListener('click', this.handleInputClick);
    selector.addEventListener('click', this.handleSelectorClick);
    document.addEventListener('click', this.handleDocumentClick, true);
  }

  removeEventListeners () {
    document.removeEventListener('click', this.handleDocumentClick, true);
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