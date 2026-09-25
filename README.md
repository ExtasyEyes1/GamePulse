# GamePulse

Учебный тематический дашборд на чистом JavaScript с ООП и ES6 Modules. Включает отдельный Next.js backend-прокси для Tracker Network API.

## Возможности

- динамическое добавление и удаление виджетов;
- независимое состояние каждого экземпляра;
- Steam charts по текущему онлайну;
- игровые раздачи через GamerPower API;
- подробная статистика VALORANT, Apex Legends, Fortnite, Overwatch 2, Rocket League, Rainbow Six Siege и Call of Duty через Tracker.gg;
- API-ключ Tracker Network хранится только на сервере Next.js;
- локальные виджеты задач и цитат;
- сворачивание и полное удаление с очисткой обработчиков событий;
- сохранение Steam account ID и задач в `localStorage`.

## Запуск

1. Создайте `backend/.env.local` по образцу `backend/.env.example` и добавьте ключ Tracker Network в `TRN_API_KEY`.
2. В терминале из `backend` выполните `npm install`, затем `npm run dev`.
3. В другом терминале из корня проекта запустите `python -m http.server 8000` и откройте `http://localhost:8000`.

Next.js API будет доступен на `http://localhost:3000`. При раздельном размещении фронтенда и API задайте `FRONTEND_ORIGIN` на сервере. Получить Tracker Network API key нужно в кабинете разработчика Tracker Network; ключ нельзя добавлять во frontend-код или коммитить `.env.local`.
