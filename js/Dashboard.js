import ToDoWidget from './ToDoWidget.js';
import QuoteWidget from './QuoteWidget.js';
import DotaStatsWidget from './DotaStatsWidget.js';
import DealsWidget from './DealsWidget.js';
export default class Dashboard {
  constructor(container) { this.container = container; this.widgets = []; this.types = { todo: ToDoWidget, quote: QuoteWidget, dota: DotaStatsWidget, deals: DealsWidget }; }
  mount(targetId, widgetType) { const target = document.getElementById(targetId); const Widget = this.types[widgetType]; if (!target || !Widget) return; const widget = new Widget({ id: `${widgetType}-${Date.now()}` }); widget.onDestroy = id => this.removeWidget(id, false); this.widgets.push(widget); target.append(widget.render()); }
  clear() { this.widgets.slice().forEach(widget => widget.destroy()); this.widgets = []; }
  addWidget(widgetType) { const Widget = this.types[widgetType]; if (!Widget) return; const widget = new Widget({ id: `${widgetType}-${Date.now()}` }); widget.onDestroy = id => this.removeWidget(id, false); this.widgets.push(widget); this.container.append(widget.render()); this.updateCount(); }
  removeWidget(widgetId, destroy = true) { const widget = this.widgets.find(item => item.id === widgetId); if (!widget) return; if (destroy) widget.destroy(); this.widgets = this.widgets.filter(item => item.id !== widgetId); this.updateCount(); }
  refresh() { this.widgets.filter(w => typeof w.load === 'function').forEach(w => w.load()); }
  updateCount() { const counter = document.querySelector('#widget-count'); if (counter) counter.textContent = this.widgets.length; }
}
