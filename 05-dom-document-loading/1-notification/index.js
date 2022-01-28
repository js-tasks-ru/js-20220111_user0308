export default class NotificationMessage {
  static prevNotification;

  constructor (
    msg = '',
    {
      duration = 2000,
      type = 'success',
    } = {}) {
    this.msg = msg;
    this.duration = duration;
    this.type = type;

    this.render();
  }

  getTemplate () {
    return `
      <div class="notification ${this.type}" style="--value:${this.duration / 1000}s">
        <div class="timer"></div>
        <div class="inner-wrapper">
          <div class="notification-header">${this.type}</div>
          <div class="notification-body">
            ${this.msg}
          </div>
        </div>
      </div>
    `
  }

  render () {
    const element = document.createElement('div');

    element.innerHTML = this.getTemplate();

    this.element = element.firstElementChild;
  }

  show (target = document.body) {
    if(NotificationMessage.prevNotification) {
      NotificationMessage.prevNotification.remove();
    }

    NotificationMessage.prevNotification = this.element;

    target.append(this.element);
    setTimeout(() => this.remove(), this.duration);
  }

  remove () {
    this.element.remove();
  }

  destroy() {
      if(this.element) {
          this.remove();
          this.element = null;
      }
  }
}