import UIComponent from './UIComponent.js';

const GAME_OPTIONS = [
  { value: 'valorant', label: 'VALORANT', platforms: ['riot'] },
  { value: 'apex', label: 'Apex Legends', platforms: ['origin', 'psn', 'xbl'] },
  { value: 'fortnite', label: 'Fortnite', platforms: ['epic'] },
  { value: 'overwatch-2', label: 'Overwatch 2', platforms: ['battlenet'] },
  { value: 'rocket-league', label: 'Rocket League', platforms: ['epic', 'steam', 'psn', 'xbl'] },
  { value: 'rainbow-six', label: 'Rainbow Six Siege', platforms: ['ubi', 'psn', 'xbl'] },
  { value: 'call-of-duty', label: 'Call of Duty', platforms: ['battle', 'psn', 'xbl', 'steam'] },
];
const PLATFORM_LABELS = { riot: 'Riot ID', origin: 'EA / Origin', psn: 'PlayStation', xbl: 'Xbox', epic: 'Epic Games', battlenet: 'Battle.net', battle: 'Battle.net', steam: 'Steam', ubi: 'Ubisoft' };

export default class TrackerWidget extends UIComponent {
  constructor(config = {}) { super({ ...config, title: 'Tracker.gg / Профиль игрока', icon: '⌁' }); this.segments = []; }

  render() {
    super.render();
    this.body.innerHTML = `<form class="tracker-form"><label>Игра<select name="game">${GAME_OPTIONS.map(game => `<option value="${game.value}">${game.label}</option>`).join('')}</select></label><label>Платформа<select name="platform"></select></label><label class="tracker-name-label">Никнейм<input name="name" maxlength="80" autocomplete="off" placeholder="Например, Player"></label><label class="tracker-tag-label">Тег Riot ID<input name="tag" maxlength="32" autocomplete="off" placeholder="Например, EUW"></label><button class="solid-button" type="submit">Найти профиль <span>↗</span></button></form><div class="tracker-feedback" role="status" aria-live="polite"><div class="tracker-empty"><span class="tracker-mark">GG</span><p>Выбери игру, введи данные профиля и загрузи статистику.</p><small>Данные будут запрошены через защищенный сервер GamePulse.</small></div></div>`;
    const form = this.body.querySelector('.tracker-form');
    this.listen(form.game, 'change', () => this.updatePlatforms());
    this.listen(form, 'submit', event => { event.preventDefault(); this.search(); });
    this.listen(this.body.querySelector('.tracker-feedback'), 'click', event => {
      const button = event.target.closest('button[data-segment]');
      if (!button) return;
      this.body.querySelectorAll('.tracker-segments button').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      this.renderStats(this.body.querySelector('.tracker-stats'), this.segments[Number(button.dataset.segment)]);
    });
    this.updatePlatforms();
    return this.element;
  }

  updatePlatforms() {
    const form = this.body.querySelector('.tracker-form');
    const game = GAME_OPTIONS.find(item => item.value === form.elements.namedItem('game').value);
    form.elements.namedItem('platform').innerHTML = game.platforms.map(platform => `<option value="${platform}">${PLATFORM_LABELS[platform]}</option>`).join('');
    this.body.querySelector('.tracker-tag-label').hidden = game.value !== 'valorant';
  }

  async search() {
    const form = this.body.querySelector('.tracker-form');
    const game = form.elements.namedItem('game').value;
    const name = form.elements.namedItem('name').value.trim();
    const tag = form.elements.namedItem('tag').value.trim();
    if (!name || (game === 'valorant' && !tag)) {
      this.showMessage('Заполни никнейм и необходимые данные профиля.', true);
      return;
    }
    this.showMessage('Ищу профиль и загружаю статистику...', false, true);
    const apiOrigin = window.GAMEPULSE_API_URL || (['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://localhost:3000' : location.origin);
    const params = new URLSearchParams({ platform: form.elements.namedItem('platform').value, name, tag });
    try {
      const response = await fetch(`${apiOrigin}/api/tracker/${encodeURIComponent(game)}?${params}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Не удалось загрузить профиль.');
      this.renderProfile(payload);
    } catch (error) {
      this.showMessage(error.message === 'Failed to fetch' ? 'Не удалось подключиться к прокси. Запусти Next.js backend на порту 3000 и проверь TRN_API_KEY.' : error.message, true);
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

  renderProfile(payload) {
    const data = payload?.data;
    const info = data?.platformInfo || {};
    const segments = Array.isArray(data?.segments) ? data.segments : [];
    if (!data || !segments.length) { this.showMessage('Профиль найден, но Tracker.gg не вернул статистические сегменты для этого аккаунта.', true); return; }
    this.segments = segments;
    const area = this.body.querySelector('.tracker-feedback');
    area.replaceChildren();
    const profile = document.createElement('div');
    profile.className = 'tracker-profile';
    const avatar = document.createElement(info.avatarUrl ? 'img' : 'div');
    avatar.className = 'tracker-avatar';
    if (info.avatarUrl) { avatar.src = info.avatarUrl; avatar.alt = ''; } else avatar.textContent = (info.platformUserHandle || '?').slice(0, 1).toUpperCase();
    const identity = document.createElement('div');
    identity.className = 'tracker-identity';
    const handle = document.createElement('strong'); handle.textContent = info.platformUserHandle || 'Игровой профиль';
    const detail = document.createElement('small'); detail.textContent = `${info.platformUserIdentifier || info.platformSlug || 'Tracker.gg'} · ${segments.length} ${segments.length === 1 ? 'раздел' : 'раздела статистики'}`;
    identity.append(handle, detail);
    const badge = document.createElement('span'); badge.className = 'tracker-badge'; badge.textContent = 'PROFILE FOUND';
    profile.append(avatar, identity, badge);
    const sectionNav = document.createElement('div'); sectionNav.className = 'tracker-segments';
    const stats = document.createElement('div'); stats.className = 'tracker-stats';
    segments.forEach((segment, index) => {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.segment = String(index); button.textContent = segment.metadata?.name || segment.type || `Раздел ${index + 1}`; button.classList.toggle('active', index === 0);
      sectionNav.append(button);
    });
    area.append(profile, sectionNav, stats);
    this.renderStats(stats, segments[0]);
  }

  renderStats(container, segment) {
    container.replaceChildren();
    const entries = Object.entries(segment.stats || {}).slice(0, 18);
    if (!entries.length) { container.textContent = 'В этом разделе нет доступных показателей.'; return; }
    entries.forEach(([key, stat]) => {
      const card = document.createElement('div'); card.className = 'tracker-stat';
      const label = document.createElement('span'); label.textContent = stat.displayName || stat.name || key.replace(/([A-Z])/g, ' $1');
      const value = document.createElement('strong'); value.textContent = stat.displayValue ?? stat.value ?? '—';
      if (stat.rank) { const rank = document.createElement('small'); rank.textContent = `${stat.rank} ${stat.percentile ? `· топ ${100 - stat.percentile}%` : ''}`; card.append(label, value, rank); } else card.append(label, value);
      container.append(card);
    });
  }
}
