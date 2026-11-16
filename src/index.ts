// SSR-safe public entry. Phaser is dynamically imported by GameBase after mount.
export { default as GameBase } from './GameBase.vue';
export { defaultGameDefinition, assertGameDefinition, validateGameDefinition } from './game/config/gameDefinition';
export type { GameDefinition } from './game/config/gameDefinition';
export type { HeroDefinition, EnemyDefinition, SkillDefinition, GameMap } from './game/config/content';
export type { VisualTheme, VisualAssetDefinition, AnimationDefinition, VisualMode } from './game/art/themes/types';
export type { GamePlatformAdapter, PlayerIdentity, PlatformRun, RunStatistics, StartRunRequest, PremiumActionResult } from './game/platform/GamePlatformAdapter';
export { LocalPlatformAdapter } from './game/platform/LocalPlatformAdapter';
export { MemoryPlatformAdapter, MemoryStorage } from './game/platform/MemoryPlatformAdapter';
