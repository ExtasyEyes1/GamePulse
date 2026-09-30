import UIComponent from './UIComponent.js';

const apiOrigins = () => window.GAMEPULSE_API_URL
  ? [window.GAMEPULSE_API_URL]
  : ['localhost', '127.0.0.1'].includes(location.hostname)
    ? ['http://localhost:3000', 'http://localhost:3001']
    : [location.origin];

export default class CatWidget extends UIComponent {
  constructor(config = {}) { super({ ...config, title: 'Cat Signal / Случайный кот', icon: '⌁' }); }

  render() {
    super.render();
    this.body.innerHTML = `<div class="cat-toolbar"><div><span>LIVE FELINE STREAM</span><strong>Один запрос — один новый кот.</strong></div><button class="solid-button" type="button" data-new-cat>Новый кот <span>↗</span></button></div><div class="tracker-feedback cat-feedback" role="status" aria-live="polite"><div class="tracker-empty"><span class="tracker-mark">=^.^=</span><p>Загружаю первую запись из кошачьего эфира.</p><small>Фотография и данные приходят через защищённый сервер GamePulse.</small></div></div>`;
    this.listen(this.body.querySelector('[data-new-cat]'), 'click', () => this.loadCat());
    this.loadCat();
    return this.element;
  }

  async loadCat() {
    this.showMessage('Ищу котика в эфире...', false, true);
    try {
      let lastError;
      for (const apiOrigin of apiOrigins()) {
        try {
          const response = await fetch(`${apiOrigin}/api/cats`);
          const payload = await response.json().catch(() => ({}));
          const canTryNextLocalProxy = apiOrigins().length > 1 && (response.status === 404 || response.status >= 500);
          if (!response.ok && canTryNextLocalProxy) { lastError = new Error(payload.error || 'Прокси временно недоступен.'); continue; }
          if (!response.ok) throw new Error(payload.error || 'Не удалось загрузить котика.');
          this.renderCat(payload.cat);
          return;
        } catch (error) {
          lastError = error;
          const isNetworkError = error instanceof TypeError || /Failed to fetch|NetworkError|fetch failed/i.test(error.message);
          if (!isNetworkError) throw error;
        }
      }
      throw lastError || new Error('Не удалось подключиться к прокси.');
    } catch (error) {
      const isNetworkError = error instanceof TypeError || /Failed to fetch|NetworkError|fetch failed/i.test(error.message);
      this.showMessage(isNetworkError ? 'Не удалось подключиться к прокси. Проверь Next.js backend на порту 3000 или 3001.' : error.message, true);
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
