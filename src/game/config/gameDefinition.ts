import { CHARACTERS } from './characters';
import { ABILITIES } from '../abilities/definitions';
import { AVAILABLE_MAPS } from './biomes';
import { BALANCE } from './gameBalance';
import { enemies } from './enemies';
import { skills } from './abilities';
import { waves } from './waves';
import { progression } from './progression';
import { victory, type VictoryCondition } from './victory';
import type { HeroDefinition, EnemyDefinition, SkillDefinition, GameMap, WaveDefinition } from './content';
import { defaultTheme } from '../art/themes/default';
import { primitiveTheme } from '../art/themes/primitive';
import type { VisualMode, VisualTheme } from '../art/themes/types';
export interface GameDefinition {
  id: string; title: string; description: string;
  heroes: Readonly<Record<string, HeroDefinition>>; enemies: Readonly<Record<string, EnemyDefinition>>;
  skills: Readonly<Record<string, SkillDefinition>>; maps: Readonly<Record<string, GameMap>>;
  defaultHero: string; defaultMap: string; progression: typeof progression;
  runDuration: number; victory: VictoryCondition;
  difficulty: { director: 'survivor' | 'waves'; hpPer600: number; damagePer900: number };
  spawn: { rate: number; waves: readonly WaveDefinition[]; encounters: boolean };
  combat: { regularCap: number; projectileCap: number; effectCap: number; orbCap: number; invulnerability: number; despawnDistance: number };
  themes: Readonly<Record<VisualMode, VisualTheme>>; visualMode: VisualMode;
}
export const defaultGameDefinition: GameDefinition = {
  id: 'game-base', title: 'Game Base', description: 'Двигайся. Собирай магию. Победи Стража.',
  heroes: Object.fromEntries(Object.entries(CHARACTERS).map(([id, hero]) => [id, {
    ...hero, id, archetype: id === 'warrior' ? 'warrior' : 'mage', asset: id,
    startingAbilities: [id === 'warrior' ? 'cleave' : 'fireball'],
    skillPool: ABILITIES.filter(a => (a.character ?? 'mage') === id).map(a => a.id),
    animations: { idle: 'idle', move: 'run', death: 'death' },
  } satisfies HeroDefinition])),
  enemies, skills, maps: Object.fromEntries(AVAILABLE_MAPS.map(map => [map.id, { ...map, asset: map.id }])),
  defaultHero: 'mage', defaultMap: 'grove', progression, runDuration: 1200, victory,
  difficulty: { director: 'survivor', hpPer600: .45, damagePer900: .3 },
  spawn: { rate: 1.3, waves, encounters: true },
  combat: { regularCap: BALANCE.regularCap, projectileCap: BALANCE.projectileCap, effectCap: BALANCE.effectCap, orbCap: BALANCE.orbCap, invulnerability: BALANCE.invulnerability, despawnDistance: BALANCE.despawnDistance },
  themes: { default: defaultTheme, primitive: primitiveTheme }, visualMode: 'default',
};
export { validateGameDefinition, assertGameDefinition } from './validateGameDefinition';
