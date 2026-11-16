# Архитектура Game Base v1

`src/index.ts` — публичная точка входа. `src/GameBase.vue` встраивается в существующее Vue-приложение; `src/App.vue` и `src/main.ts` — самостоятельная Vite-демка.

## Поток данных

1. Компонент получает `GameDefinition` и `GamePlatformAdapter`, загружает локальный профиль.
2. Только в `onMounted` динамически импортирует `bootstrap/createGame.ts` и Phaser.
3. `GameScene` владеет вводом, Phaser update, представлением, звуком и публикацией снимков.
4. `World` — существующая синхронная симуляция без DOM и таймеров. Конфигурация передаётся через `RunOptions.definition` и сохраняется при перезапуске.
5. Vue получает снимки через отдельный `GameBridge` с частотой до 10 Гц; радар — до 5 Гц. Состояние каждого врага не переносится в Vue.
6. Адаптер получает начало/окончание забега и статистику. Ошибка сохранения не останавливает игру; компонент сообщает `platform-error`.

## Слои и файлы

| Слой | Файлы |
|---|---|
| Контент и проверка ссылок | `src/game/config/gameDefinition.ts`, `content.ts`, `validateGameDefinition.ts` |
| Базовые герои и навыки | `config/characters.ts`, `config/abilities.ts`, `abilities/*.ts` |
| Враги и поведение | `config/enemies.ts`, `systems/EnemySystem.ts`, `BossSystem.ts`, специализированные boss-системы |
| Рост сложности | `config/waves.ts`, `systems/RunDirector.ts`, `DifficultyDirector.ts` |
| Прогрессия и бой | `World.ts`, `ExperienceSystem.ts`, `UpgradeSystem.ts`, `CombatSystem.ts` |
| HD-представление | `art/GameArt.ts`, исходные `*Pack.ts` и `*Manifest.json` |
| Темы | `art/themes/types.ts`, `default/`, `primitive/`, `GenericPresentation.ts`, `customAssets.ts` |
| Интеграция | `platform/GamePlatformAdapter.ts`, `LocalPlatformAdapter.ts`, `MemoryPlatformAdapter.ts` |

Внешние ID контента отделены от поведения. `World.heroId` — ID героя, `World.character` — совместимый архетип `mage`/`warrior`. `Enemy.definitionId` — ID врага, `Enemy.kind` — ключ существующей стратегии. Поэтому несколько новых врагов могут использовать стратегию `caster` с разными параметрами. Внутренние проверки boss kind сохранены как часть специализированных AI.

## Lifecycle и ограничения

- У каждого компонента собственные каналы. Компоненты HUD получают их через Vue provide/inject.
- Keyboard-ввод ограничен корневым элементом игры; gamepad обслуживает игру с фокусом. События потери фокуса и видимости очищают удержанные кнопки.
- `ResizeObserver` вызывает `scale.setParentSize`; поддерживается изменение размера контейнера без resize окна.
- Размонтирование удаляет Vue-подписки/слушатели, отключает observer и уничтожает Phaser. Сцена использует идемпотентную очистку на **SHUTDOWN и DESTROY**.
- Игровой CSS ограничен `.game-base`; только `demo.css` задаёт размеры `html/body/#app` в самостоятельной демке.
- Изменение definition/темы во время активной симуляции не поддерживается. Для другой конфигурации используйте новый Vue `key`.
- Сохраняются существующие пулы, spatial grid, ограничение `dt` 0.05 с, бюджеты 150 обычных врагов / 96 снарядов / 240 XP / 96 эффектов. Специализированные bosses/guardians имеют отдельные прежние бюджеты.
- Данные адаптера и mutable-конфигурация не должны изменяться хостом во время забега.

Новый archetype, принципиально новый AI или особая способность требуют TypeScript-поведения. Обычные параметры и новые ID контента не требуют изменения World или GameScene.
