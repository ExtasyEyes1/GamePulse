import UIComponent from './UIComponent.js';

const CAT_API_URL = 'https://api.thecatapi.com/v1/images/search?limit=1&has_breeds=1';

export default class CatWidget extends UIComponent {
  constructor(config = {}) { super({ ...config, title: 'Cat Signal / Случайный кот', icon: '⌁' }); }

  render() {
    super.render();
    this.body.innerHTML = `<div class="cat-toolbar"><div><span>LIVE FELINE STREAM</span><strong>Один запрос — один новый кот.</strong></div><button class="solid-button" type="button" data-new-cat>Новый кот <span>↗</span></button></div><div class="tracker-feedback cat-feedback" role="status" aria-live="polite"><div class="tracker-empty"><span class="tracker-mark">=^.^=</span><p>Загружаю первую запись из кошачьего эфира.</p><small>Фотография и данные приходят из публичного The Cat API.</small></div></div>`;
    this.listen(this.body.querySelector('[data-new-cat]'), 'click', () => this.loadCat());
    this.loadCat();
    return this.element;
  }

  async loadCat() {
    this.showMessage('Ищу котика в эфире...', false, true);
    try {
      const response = await fetch(CAT_API_URL);
      const payload = await response.json().catch(() => null);
      const source = Array.isArray(payload) ? payload[0] : null;
      if (!response.ok || !source?.url) throw new Error('The Cat API не вернул фотографию.');
      const breed = source.breeds?.[0] || {};
      this.renderCat({
        id: source.id,
        imageUrl: source.url,
        breed: {
          name: breed.name || null,
          origin: breed.origin || null,
          temperament: breed.temperament || null,
          lifeSpan: breed.life_span || null,
          weight: breed.weight?.metric || null,
          description: breed.description || null,
        },
      });
    } catch {
      this.showMessage('Не удалось загрузить котика. Попробуй ещё раз.', true);
    }
  }

  showMessage(message, isError, loading = false) {
    const area = this.body.querySelector('.tracker-feedback');
    area.replaceChildren();
    const status = document.createElement('p');
    status.className = loading ? 'loading' : isError ? 'error-state tracker-error' : 'empty-state';
    status.textContent = message;
    area.append(status);
  }

  renderCat(cat) {
    if (!cat?.imageUrl) { this.showMessage('The Cat API не вернул фотографию.', true); return; }
    const area = this.body.querySelector('.tracker-feedback');
    area.replaceChildren();
    const layout = document.createElement('article'); layout.className = 'cat-result';
    const image = document.createElement('img'); image.className = 'cat-image'; image.src = cat.imageUrl; image.alt = cat.breed?.name ? `Кот породы ${cat.breed.name}` : 'Случайный кот'; image.loading = 'eager'; image.referrerPolicy = 'no-referrer';
    const content = document.createElement('div'); content.className = 'cat-content';
    const label = document.createElement('span'); label.className = 'cat-label'; label.textContent = `CAT ID / ${cat.id || 'UNKNOWN'}`;
    const title = document.createElement('h2'); title.textContent = cat.breed?.name || 'Кот без паспорта';
    const description = document.createElement('p'); description.textContent = cat.breed?.description || 'Этот кот передал только фотографию. Иногда этого уже достаточно.';
    const facts = document.createElement('dl'); facts.className = 'cat-facts';
    const entries = [['Происхождение', cat.breed?.origin], ['Характер', cat.breed?.temperament], ['Живёт', cat.breed?.lifeSpan && `${cat.breed.lifeSpan} лет`], ['Вес', cat.breed?.weight && `${cat.breed.weight} кг`]].filter(([, value]) => value);
    entries.forEach(([term, value]) => { const row = document.createElement('div'); const dt = document.createElement('dt'); dt.textContent = term; const dd = document.createElement('dd'); dd.textContent = value; row.append(dt, dd); facts.append(row); });
    content.append(label, title, description, facts); layout.append(image, content); area.append(layout);
  }
}
