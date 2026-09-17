export default class UIComponent {
  constructor({ id, title, icon = '◈' } = {}) { this.id = id || `widget-${crypto.randomUUID()}`; this.title = title || 'Виджет'; this.icon = icon; this.element = null; this.boundListeners = []; this.minimized = false; }
  render() { this.element = document.createElement('article'); this.element.className = 'widget'; this.element.id = this.id; this.element.innerHTML = `<header class="widget-header"><div class="widget-title"><span class="widget-icon">${this.icon}</span><h2>${this.title}</h2></div></header><div class="widget-body"></div>`; return this.element; }
  get body() { return this.element ? this.element.querySelector('.widget-body') : null; }
  listen(target, event, handler) { target.addEventListener(event, handler); this.boundListeners.push({ target, event, handler }); }
  minimize() { this.minimized = !this.minimized; if (this.body) this.body.classList.toggle('is-collapsed', this.minimized); const button = this.element ? this.element.querySelector('.minimize') : null; if (button) button.textContent = this.minimized ? '+' : '−'; }
  destroy() { this.boundListeners.forEach(({ target, event, handler }) => target.removeEventListener(event, handler)); if (this.element) this.element.remove(); if (this.onDestroy) this.onDestroy(this.id); }
}
