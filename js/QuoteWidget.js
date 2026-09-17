import UIComponent from './UIComponent.js';
export default class QuoteWidget extends UIComponent {
  constructor(config = {}) { super({ ...config, title: 'Игровой импульс', icon: '✦' }); this.quotes = ['Победа — это еще не всё, желание победить — вот что важно.', 'Каждый матч — новая история.', 'Сложные игры делают сильнее.']; this.current = 0; }
  render() { super.render(); this.body.innerHTML = `<blockquote></blockquote><button class="outline-button next-quote">Следующая цитата ↻</button>`; this.listen(this.body.querySelector('.next-quote'), 'click', () => { this.current = (this.current + 1) % this.quotes.length; this.update(); }); this.update(); return this.element; }
  update() { this.body.querySelector('blockquote').textContent = `“${this.quotes[this.current]}”`; }
}
