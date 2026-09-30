import UIComponent from './UIComponent.js';

const ACCOUNT_TYPES = [
  { value: 'epic', label: 'Epic Games' },
  { value: 'psn', label: 'PlayStation Network' },
  { value: 'xbl', label: 'Xbox Live' },
];

const DISPLAY_NAMES = {
  score: 'Очки', wins: 'Победы', winRate: 'Винрейт', kills: 'Убийства', kd: 'K/D',
  matches: 'Матчи', deaths: 'Смерти', killsPerMatch: 'Убийства за матч',
  scorePerMatch: 'Очки за матч', minutesPlayed: 'Минут в игре', playersOutlived: 'Пережито игроков',
};

export default class FortniteWidget extends UIComponent {
  constructor(config = {}) { super({ ...config, title: 'Fortnite Tracker / Battle Royale', icon: '⌁' }); this.modes = []; }

  render() {
    super.render();
    this.body.innerHTML = `<form class="tracker-form"><label>Платформа<select name="accountType">${ACCOUNT_TYPES.map(({ value, label }) => `<option value="${value}">${label}</option>`).join('')}</select></label><label class="tracker-name-label">Игровое имя<input name="name" maxlength="80" autocomplete="off" placeholder="Epic Display Name"></label><button class="solid-button" type="submit">Найти профиль <span>↗</span></button></form><div class="tracker-feedback" role="status" aria-live="polite"><div class="tracker-empty"><span class="tracker-mark">FN</span><p>Введи игровое имя Fortnite и выбери платформу.</p><small>Статистика загружается через защищённый сервер GamePulse.</small></div></div>`;
    const form = this.body.querySelector('.tracker-form');
    this.listen(form, 'submit', event => { event.preventDefault(); this.search(); });
    this.listen(this.body.querySelector('.tracker-feedback'), 'click', event => {
      const button = event.target.closest('button[data-mode]');
      if (!button) return;
      this.body.querySelectorAll('.tracker-segments button').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      this.renderStats(this.body.querySelector('.tracker-stats'), this.modes[Number(button.dataset.mode)]);
    });
    return this.element;
  }

  async search() {
    const form = this.body.querySelector('.tracker-form');
    const name = form.elements.namedItem('name').value.trim();
    if (!name) { this.showMessage('Введи игровое имя Fortnite.', true); return; }
    this.showMessage('Ищу Fortnite-профиль и загружаю статистику...', false, true);
    const apiOrigins = window.GAMEPULSE_API_URL
      ? [window.GAMEPULSE_API_URL]
      : ['localhost', '127.0.0.1'].includes(location.hostname)
        ? ['http://localhost:3000', 'http://localhost:3001']
        : [location.origin];
    const params = new URLSearchParams({ name, accountType: form.elements.namedItem('accountType').value });
    try {
      let lastNetworkError;
      for (const apiOrigin of apiOrigins) {
        try {
          const response = await fetch(`${apiOrigin}/api/fortnite?${params}`);
          const payload = await response.json().catch(() => ({}));
          const canTryNextLocalProxy = apiOrigins.length > 1 && (response.status === 404 || response.status >= 500);
          if (!response.ok && canTryNextLocalProxy) { lastNetworkError = new Error(payload.error || 'Прокси временно недоступен.'); continue; }
          if (!response.ok) throw new Error(payload.error || 'Не удалось загрузить профиль.');
          this.renderProfile(payload.data);
          return;
        } catch (error) {
          lastNetworkError = error;
          const isNetworkError = error instanceof TypeError || /Failed to fetch|NetworkError|fetch failed/i.test(error.message);
          if (!isNetworkError) throw error;
        }
      }
      throw lastNetworkError || new Error('Не удалось подключиться к прокси.');
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

  renderProfile(data) {
    const account = data?.account || {};
    const allModes = data?.stats?.all || {};
    this.modes = Object.entries(allModes).filter(([, mode]) => mode?.overall && Object.keys(mode.overall).length);
    if (!this.modes.length) { this.showMessage('Профиль найден, но Fortnite API не вернул открытой Battle Royale статистики.', true); return; }
    const area = this.body.querySelector('.tracker-feedback');
    area.replaceChildren();
    const profile = document.createElement('div'); profile.className = 'tracker-profile';
    const avatar = document.createElement(data?.image ? 'img' : 'div'); avatar.className = 'tracker-avatar';
    if (data?.image) { avatar.src = data.image; avatar.alt = ''; } else avatar.textContent = 'FN';
    const identity = document.createElement('div'); identity.className = 'tracker-identity';
    const handle = document.createElement('strong'); handle.textContent = account.name || 'Fortnite profile';
    const detail = document.createElement('small'); detail.textContent = `${account.id || 'Epic Games'} · ${this.modes.length} ${this.modes.length === 1 ? 'режим' : 'режима статистики'}`;
    identity.append(handle, detail);
    const badge = document.createElement('span'); badge.className = 'tracker-badge'; badge.textContent = 'PROFILE FOUND';
    profile.append(avatar, identity, badge);
    const modeNav = document.createElement('div'); modeNav.className = 'tracker-segments';
    const stats = document.createElement('div'); stats.className = 'tracker-stats';
    this.modes.forEach(([name], index) => {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.mode = String(index); button.textContent = name; button.classList.toggle('active', index === 0); modeNav.append(button);
    });
    area.append(profile, modeNav, stats);
    this.renderStats(stats, this.modes[0]);
  }

  renderStats(container, [, mode]) {
    container.replaceChildren();
    const entries = Object.entries(mode.overall || {}).filter(([, value]) => value !== null && value !== undefined).slice(0, 18);
    if (!entries.length) { container.textContent = 'В этом режиме нет доступных показателей.'; return; }
    entries.forEach(([key, value]) => {
      const card = document.createElement('div'); card.className = 'tracker-stat';
      const label = document.createElement('span'); label.textContent = DISPLAY_NAMES[key] || key.replace(/([A-Z])/g, ' $1');
      const stat = document.createElement('strong'); stat.textContent = typeof value === 'number' ? new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value) : String(value);
      card.append(label, stat); container.append(card);
    });
  }
}
