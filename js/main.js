import Dashboard from './Dashboard.js';

document.head.insertAdjacentHTML('beforeend', '<link rel="stylesheet" href="styles/soft.css"><link rel="stylesheet" href="styles/light.css"><link rel="stylesheet" href="styles/finish.css"><link rel="stylesheet" href="styles/final2.css"><link rel="stylesheet" href="styles/labels.css"><link rel="stylesheet" href="styles/tracker.css">');
const matrix = document.createElement('div');
matrix.className = 'matrix-rain';
const glyphs = '01{}[]<>/\\+=*#@';
for (let i = 0; i < 22; i++) {
  const column = document.createElement('span');
  column.className = 'matrix-column';
  column.textContent = Array.from({ length: 28 }, () => glyphs[Math.floor(Math.random() * glyphs.length)]).join('\n');
  column.style.left = `${Math.random() * 100}%`;
  column.style.animationDuration = `${10 + Math.random() * 14}s`;
  column.style.animationDelay = `${-Math.random() * 15}s`;
  matrix.append(column);
}
document.body.append(matrix);

const navItems = [['#home', 'Главная'], ['#charts', 'Чарты'], ['#giveaways', 'Раздачи'], ['#tasks', 'Задачи'], ['#fortnite', 'Fortnite']];
document.querySelectorAll('.main-nav a').forEach((link, index) => { link.href = navItems[index][0]; link.textContent = navItems[index][1]; });
const app = document.querySelector('#app');
const dashboard = new Dashboard(app);
const views = {
  home: () => `<section class="home-view"><div class="hero-glitch"><span class="hero-kicker">// PLAYER SYSTEM ONLINE</span><h1>PLAY<br><em>THE NOISE</em></h1><p>Персональный игровой центр для тех, кто любит видеть больше, чем просто счет побед.</p><div class="hero-actions"><a class="cta" href="#fortnite">Проверить Fortnite <b>↗</b></a><a class="ghost-link" href="#giveaways">Смотреть раздачи <b>↓</b></a></div><div class="hero-lines"><span>01 / SIGNAL</span><span>02 / INPUT</span><span>03 / OUTPUT</span></div></div><div class="home-side"><div class="signal-card"><span class="signal-label">SYSTEM SIGNAL</span><strong>99.8<span>%</span></strong><small>connection stable</small><i></i></div><div class="quote-place"><span>QUOTE OF THE DAY</span><blockquote>«Каждый матч — новая история.»</blockquote><small>— GAMEPULSE / 001</small></div></div></section><section class="home-strip"><span>LIVE API STREAM</span><span class="ticker">STEAM CHARTS // FORTNITE API // GAME GIVEAWAYS // PERSONAL GOALS //</span></section>`,
  dota: () => `<section class="page-head"><span class="page-index">01 / STEAM API</span><h1>GAME<br><em>ONLINE CHARTS</em></h1><p>Текущий онлайн выбранной игры через Steam Web API.</p></section><div class="single-widget" id="dota-mount"></div>`,
  deals: () => `<section class="page-head"><span class="page-index">02 / GAME GIVEAWAYS</span><h1>FREE<br><em>GAME DROPS</em></h1><p>Поиск и просмотр текущих игровых раздач.</p></section><div class="single-widget" id="deals-mount"></div>`,
  tasks: () => `<section class="page-head"><span class="page-index">03 / PLAYER LOG</span><h1>YOUR<br><em>OBJECTIVES</em></h1><p>Собери личный список игровых целей и отмечай прогресс.</p></section><div class="single-widget" id="tasks-mount"></div>`,
  fortnite: () => `<section class="page-head"><span class="page-index">04 / FORTNITE API</span><h1>FORTNITE<br><em>TRACKER</em></h1><p>Статистика Battle Royale по игровому имени. Ключ Fortnite API остается на сервере.</p></section><div class="single-widget tracker-mount" id="fortnite-mount"></div>`,
};
const routeAliases = { charts: 'dota', giveaways: 'deals' };
const currentRoute = () => location.hash.slice(1) || 'home';
function render() {
  const route = currentRoute();
  const key = routeAliases[route] || route;
  setTimeout(() => {
    app.innerHTML = (views[key] || views.home)();
    dashboard.clear();
    if (key === 'dota') dashboard.mount('dota-mount', 'dota');
    if (key === 'deals') dashboard.mount('deals-mount', 'deals');
    if (key === 'tasks') dashboard.mount('tasks-mount', 'todo');
    if (key === 'fortnite') dashboard.mount('fortnite-mount', 'fortnite');
    document.querySelectorAll('.main-nav a').forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${route}`));
    document.querySelector('.main-nav').classList.remove('open');
    document.querySelector('.menu-toggle').setAttribute('aria-expanded', 'false');
  }, 80);
}
const menu = document.querySelector('.menu-toggle');
menu.addEventListener('click', () => { const nav = document.querySelector('.main-nav'); const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
const themes = ['dark', 'light'];
const savedTheme = localStorage.getItem('gamepulse-theme');
document.body.dataset.theme = themes.includes(savedTheme) ? savedTheme : 'dark';
document.querySelector('#theme-switch').addEventListener('click', () => { const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark'; document.body.dataset.theme = next; localStorage.setItem('gamepulse-theme', next); });
window.addEventListener('hashchange', render);
render();
