# Настройка игры

Отправная точка — `src/game/config/gameDefinition.ts`. Полный рабочий пример второй игры — `src/games/exampleGame.ts`: другой ID, герой Pilot, навык Plasma, враг Drone, карта Orbit, две волны и победа после минуты. Он проверяется тестами.

Dev-предпросмотр: `/?game=example`; `/?game=example&visual=default` показывает заменённое анимированное тело героя из существующего Runner atlas. Это демонстрация asset pack без генерации новых картинок.

```vue
<script setup lang="ts">
import { GameBase } from './index';
import { exampleGame } from './games/exampleGame';
</script>
<template><div style="height: 600px"><GameBase :definition="exampleGame" /></div></template>
```

## Герой

Добавляйте запись в `heroes`; обновите `defaultHero`, если это единственный герой. Исходный каталог характеристик находится в `src/game/config/characters.ts`.

```ts
const heroes = {
  ...base.heroes,
  ranger: {
    ...base.heroes.mage,
    id: 'ranger', name: 'Ranger', hp: 110, speed: 145, armor: .05,
    startingAbilities: ['fireball'], skillPool: ['fireball', 'frost', 'shield'],
    asset: 'mage', animations: { idle: 'idle', move: 'run', death: 'death' },
  },
};
```

`archetype` выбирает существующие особенности Mage/Warrior, включая mobility и ultimate. В пуле — до пяти уникальных поведений; стартовые навыки должны входить в пул. Имена новых ID произвольны. Все герои из конфигурации доступны в меню, включая исходного Warrior.

## Враг

`src/game/config/enemies.ts` объединяет исходные характеристики и метаданные AI. Новый ID использует существующую стратегию:

```ts
const enemies = {
  ...base.enemies,
  sentry: {
    ...base.enemies.caster, id: 'sentry', name: 'Sentry',
    hp: 60, speed: 35, damage: 14,
    attack: { range: 310, cooldown: 3, projectileSpeed: 105 },
  },
};
```

`radius` задаёт коллизию; `asset` задаёт картинку. Caster использует `attack`; нулевые cooldown/projectileSpeed сохраняют штатное временное усиление. `spawn.offspring` задаёт ID потомка Splitter. Для собственного набора врагов отключите встроенные встречи (`spawn.encounters: false`) и выберите победу `survive`, `kills` или `endless`. Встроенный финал требует стратегии Ash Warden и остальных encounter-стратегий.

## Навык

В `src/game/config/abilities.ts` задаются параметры, в `src/game/abilities/` остаются специальные реализации.

```ts
const skills = {
  ...base.skills,
  plasma: {
    ...base.skills.fireball, id: 'plasma', behavior: 'fireball', name: 'Plasma',
    description: 'Плазменный снаряд по ближайшему врагу.',
    damage: 32, damagePerLevel: .2, cooldown: .7, range: 350,
    projectileSpeed: 300, maxLevel: 4,
  },
};
```

Включите `plasma` в `skillPool`/`startingAbilities` героя. Состояние, damage attribution и upgrade ID используют ключ поведения `fireball`; имя и описание приходят из контента. Один герой не может иметь два навыка одного поведения. Для Fireball `damagePerLevel` — множитель относительно первого ранга; у атакующих остальных навыков — добавка за текущий ранг. `damageMultiplier` применяется при фактическом попадании, `areaMultiplier` меняет площадь соответствующего поведения. Поддерживаемый предел рангов существующих специальных реализаций — 1–5.

`targeting` и `effect` описывают контракт выбранного поведения. Изменение этих метаданных не заменяет код стратегии. Особые фазы Frost, Shield, Warrior и ultimate сохраняют настройки в соответствующих `src/game/config/*.ts`.

Для нового поведения добавьте ключ в `abilities/types.ts`, реализацию и регистрацию в `abilities/tickAbilities.ts`, описание в `abilities/definitions.ts` и параметры в `config/abilities.ts`. World и GameScene менять не требуется. Учёт нового источника урона также расширяется в `ScoreSystem.emptyDamage`.

## Длительность, победа и волны

```ts
const game = {
  ...base,
  runDuration: 180,
  progression: { ...base.progression, maxLevel: 30 },
  victory: { type: 'survive' as const },
  difficulty: { ...base.difficulty, director: 'waves' as const },
  spawn: {
    rate: 1, encounters: false,
    waves: [
      { from: 0, name: 'Start', interval: 1.5, burst: 1, cap: 35, elite: 0, weights: { grunt: 3, runner: 1 } },
      { from: 60, name: 'Pressure', interval: .8, burst: 2, cap: 80, elite: .1, weights: { runner: 2, tank: 1 } },
    ],
  },
};
```

`final-boss` начинает существующую встречу в `runDuration`, победа наступает после смерти босса. `survive` завершает забег по времени, `kills` требует `{ type: 'kills', target: 100 }`, `endless` не завершает его автоматически. HP ≤ 0 приводит к поражению.

`survivor` сохраняет исходную эскалацию Enrage/Phase II; `waves` использует интервалы и состав указанных волн напрямую. HP/урон масштабируются через `difficulty.hpPer600`/`damagePer900`; особенности скорости существующих стратегий остаются в `config/pacing.ts`, `survivalEnrage.ts`, `endgame.ts`.

Вызывайте `assertGameDefinition(game)` при подготовке конфигурации. Проверяются ссылки на навыки, героев, врагов, карты, обе темы, потомков и encounter-стратегии, численные пределы и структура анимаций.
