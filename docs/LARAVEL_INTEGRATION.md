# Встраивание в Laravel + Inertia + Vue

В v1 серверная часть не реализована. Ни PHP, ни маршруты Laravel, ни авторизация не нужны для работы локальной игры.

Перенесите `src/game`, `src/ui`, `src/GameBase.vue`, `src/index.ts`, `src/style.css` в модуль существующего Vue/Vite проекта. Скопируйте `public/assets` под URL ассетов. Установите закреплённые Phaser/Vue-зависимости из package.json; используйте Vue-плагин Vite хоста. **Не переносите `main.ts`, `App.vue`, `demo.css` и `index.html`** в приложение Laravel.

```vue
<script setup lang="ts">
import { GameBase, defaultGameDefinition, LocalPlatformAdapter } from '@/game-base';
const definition = { ...defaultGameDefinition, id: 'my-game', title: 'My Game' };
const platform = new LocalPlatformAdapter(definition);
function report(error: unknown) { console.error('Game platform:', error); }
</script>
<template>
  <section style="height: min(80dvh, 720px); min-height: 360px">
    <GameBase :definition="definition" :platform="platform"
      asset-base-url="/games/my-game/" @platform-error="report" />
  </section>
</template>
```

Вторая Vue root не создаётся. Импорт entry и server render не обращаются к window/document/Phaser. Инициализация движка начинается после `onMounted`, переход Inertia размонтирует компонент и очищает игру. Контейнер должен иметь ненулевую высоту. При смене конфигурации используйте `:key="definition.id"`. Не включайте `development-tools` в production. `ready` означает создание экземпляра, загрузка ассетов ещё может продолжаться.

## Реализация адаптера

Реализуйте `src/game/platform/GamePlatformAdapter.ts`. Контракт включает identity, configuration, startRun, finishRun, submitRunStatistics, loadProfile, saveSettings, inventory, premium action и leaderboard. Компонент использует start/finish/statistics/profile/settings; остальные точки доступны будущему хосту. Получение конфигурации из адаптера применяется, если prop `definition` не передан.

```ts
import { LocalPlatformAdapter } from '@/game-base';
import type { PlayerIdentity } from '@/game-base';
// Компилируемый пример замены одного метода с сохранением локального режима.
class PreviewPlatform extends LocalPlatformAdapter {
  override async getPlayerIdentity(): Promise<PlayerIdentity> {
    return { id: 'preview', name: 'Preview player', kind: 'guest' };
  }
}
```

Сетевой адаптер должен отдельно реализовать контракт запросами к вашим API. Он сам отвечает за таймауты, повторные попытки, проверку схемы, авторизацию и идемпотентность. `clientRunId` связывает исходный snapshot и server run receipt; результат содержит тот же client ID. Не смешивайте эти два ID. Статистика отправляется после finish; повторный запрос не должен повторно начислять результат. Для тестов используйте `MemoryPlatformAdapter`: он не читает localStorage.

LocalPlatformAdapter сохраняет профиль в `game-base:<game-id>:v1`. Коррупция JSON/недоступное хранилище не блокируют игру; настройки и завершённый результат остаются в памяти текущего компонента. Рейтинг имеет `scope: 'local'`; inventory пуст; premium-запрос явно возвращает `supported: false`. Никаких покупок/денежных действий нет.

## Граница доверия

Начало, длительность, победа, урон, предметы и score формируются клиентом и могут быть изменены пользователем. Они подходят для локальной истории и telemetry. Они **не являются** доказательством для денежных начислений, premium entitlement, соревновательных наград или защищённого leaderboard. Будущий сервер обязан самостоятельно проверять права, допустимость run/result, повторы и экономические операции. Ни Wallet, ни Ledger, ни платежи в этом шаблоне не реализованы.
