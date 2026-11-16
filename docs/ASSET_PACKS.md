# Темы и ассеты

`src/game/art/themes/types.ts` описывает ассет: ID, texture key, URL изображения/атласа/спрайтлиста, размеры кадра, origin, displaySize, анимации, fps и направление/зеркалирование. Необязательный hitbox — авторская подсказка; симуляция берёт коллизии из параметров сущности.

## Default HD

`themes/default/nativeCatalog.ts` — проверяемый каталог **всех** файлов штатного HD preload. `assetRegistry.ts` сохраняет логические размеры и роли. Исходные многостраничные `*Pack.ts`/`*Manifest.json` и сложные renderer-классы сохранены. `nativeAnimationModule` означает использование этих точных native-анимаций, а не попытку автоматически интерпретировать сложный многослойный клип.

Artwork, PNG/JSON и аудио в `public/assets/` не изменялись и не генерировались заново. Их исторические имена texture/frame, включая PixelSurvivor, — часть контракта файлов.

Поля `authoring`/sourceFiles в старых manifest сохраняют историческое происхождение. Они могут называть инструменты и исходные материалы, отсутствующие в шаблоне; это метаданные, а не runtime-пути загрузчика. Их исходное состояние доступно в коммите миграции, указанном в DECISIONS.

## Заменить спрайт и анимацию

Ниже рабочее определение с существующим Runner atlas, показывающее независимые число кадров, fps и зеркалирование. Для своего проекта замените URL/имена кадров и размеры.

```ts
import type { VisualAssetDefinition } from '../game/art/themes/types';
const robot: VisualAssetDefinition = {
  id: 'robot', texture: 'robot-body',
  source: { kind: 'atlas', url: 'assets/hd/runner.png', dataUrl: 'assets/hd/runner.json' },
  dimensions: { width: 64, height: 64 },
  origin: { x: .5, y: .5 }, displaySize: { width: 24, height: 24 },
  animations: {
    idle: { name: 'idle', frameCount: 3, frameRate: 3, frames: [0,1,2].map(i => `runner-right-idle-${i}`) },
    run: { name: 'run', frameCount: 6, frameRate: 12, frames: [0,1,2,3,4,5].map(i => `runner-right-walk-${i}`) },
  },
  facing: { west: { direction: 'east', flipX: true } },
};
```

Добавьте `robot` в `game.themes.default.assets`, ссылайтесь на него из `heroes[id].asset`. В `themes.primitive.assets` добавьте тот же ID с `source: { kind: 'generated' }`. HD renderer поддерживает замену тела героя/врага/босса, снарядов и обычных Mage VFX через customAssets. Для полного независимого набора, включая terrain и другую стилистику VFX, задайте `themes.default.renderer: 'generic'`. Тогда GenericPresentation рисует собственные ассеты, а отсутствующие изображения — геометрические роли. Native-многослойные cinematics остаются в штатном HD renderer; для нового сложного клипа можно написать отдельное представление без изменения механик.

Generic-анимации используют `idle`/`walk` для врага, указанные героем имена для героя, `flight` для снаряда и `effect` для VFX. `animations[name].directions` допускает разные массивы кадров; `facing` связывает направления с ними. `loop: false` фиксирует последний кадр. Spritesheet использует численные frames, atlas — строковые frame keys.

`theme.projectiles` выбирает friendly/hostile assets; навыки могут задать свой `asset`. `theme.terrain` задаёт цвета сетки и необязательный tile asset для generic renderer. `theme.audio.samples` и `theme.audio.music` переопределяют URL по существующему ID, сохраняя звуковые шины, громкость и lifecycle. UI-иконки текущего HUD задаются `skills[id].icon`; собственный Vue HUD также можно менять независимо от симуляции.

## Primitive Mode

```ts
const game = { ...defaultGameDefinition, visualMode: 'primitive' as const };
```

Либо `<GameBase visual-mode="primitive" />`. В dev-демке доступен селектор Visual mode и `/?visual=primitive`. В production этих контролов нет. Переключение dev-селектора размонтирует старую игру и начинает новую; смена представления в середине забега не поддерживается.

Primitive использует Phaser Graphics: круг игрока, отличимые враги, квадрат босса, треугольник Guardian, снаряды, телеграфы, XP, loot/chests/artifacts, сетка terrain, щит, mobility и базовые VFX. Источники урона, попадания, cooldown и RNG не зависят от renderer. PNG/atlas для этих сущностей не загружаются; существующее аудио работает в обоих режимах.

## Базовый URL

`asset-base-url="/games/my-game/"` разрешает пути к `assets/` относительно этой базы. База по умолчанию — Vite `import.meta.env.BASE_URL`; абсолютные HTTP URL в новой теме разрешены. Для другой базы самого JS/CSS используйте Vite `base` / `vite build --base=/games/my-game/`. Файлы из `public/assets` должны присутствовать под указанным URL. Никаких runtime CDN-зависимостей по умолчанию нет.
