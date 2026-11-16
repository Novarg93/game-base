# Game Base v1

Переиспользуемая основа браузерных survivors-игр: Phaser **4.2.1**, Vue **3.5.44**, TypeScript и Vite. Исходные Mage/Warrior, бой, боссы, способности, звук, HUD, клавиатура, gamepad и touch сохранены. Backend не требуется.

## Запуск

Node.js ≥ 22.13:

```sh
npm ci
npm run dev
```

Откройте URL Vite. WASD/стрелки — движение, Space — mobility, Q — ultimate после открытия, Esc/P — пауза. На gamepad: левый стик, X/Square — mobility, Y/Triangle — ultimate, Start — пауза. На телефоне используйте landscape и экранные controls.

В PowerShell с запрещённым `npm.ps1` используйте `npm.cmd`, не меняя политику Windows.

## Проверки

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run check
npm run test:e2e
npm run test:e2e:production
```

Playwright использует установленный Chrome на Windows; в другом окружении установите Chromium командой `npx playwright install chromium`. Можно выбрать канал через `GAME_BASE_BROWSER`. E2E запускает собственный Vite на 5188, production preview — на 4188; порты переопределяются `GAME_BASE_E2E_PORT`. Production-проверке предшествует `npm run build`.

## Следующая игра

1. Скопируйте `src/games/exampleGame.ts` в свой модуль и измените `id`, title, героев, навыки, врагов и карты.
2. Настройте `progression`, `runDuration`, `victory` и `spawn.waves`. Запустите `assertGameDefinition`.
3. Добавьте свой asset pack в `src/game/art/themes/`; не меняйте коллизии ради размеров картинки.
4. Передайте конфигурацию в `<GameBase :definition="myGame" />` в текущем Vue-приложении. Создавать вторую Vue root не нужно.
5. При необходимости реализуйте `GamePlatformAdapter`; до этого используйте LocalPlatformAdapter.
6. Выполните `npm run check`, e2e и проверьте Canvas-скриншоты для desktop/mobile.

Primitive Mode: `visualMode: 'primitive'` в GameDefinition или prop `visual-mode="primitive"`. В dev-демке есть Visual mode selector и `/?visual=primitive`; production UI не содержит отладочного селектора.

| Документ | Назначение |
|---|---|
| [ARCHITECTURE](docs/ARCHITECTURE.md) | Слои, события и lifecycle |
| [GAME_CONFIGURATION](docs/GAME_CONFIGURATION.md) | Герои, враги, навыки, волны и победа |
| [ASSET_PACKS](docs/ASSET_PACKS.md) | Спрайты, анимации, темы и URL ассетов |
| [LARAVEL_INTEGRATION](docs/LARAVEL_INTEGRATION.md) | Встраивание в Vue/Inertia и контракт адаптера |
| [PROGRESS](docs/PROGRESS.md) | Итоговая проверка и ограничения |
| [DECISIONS](docs/DECISIONS.md) | Принятые решения |

`public/assets` — необходимые runtime-файлы, их исходные имена сохранены. Старые stage-документы и инструменты, зависевшие от исключённых при миграции art/review-материалов, удалены. Новые `tests/`, `docs/`, `screenshots/` входят в исходники.

Локальные результаты не защищены от изменения клиентом. Их нельзя использовать как доказательство для финансовых начислений или соревновательных наград. Laravel, платежи, авторизация и базы данных в v1 не реализованы.
