import type { CharacterId } from './characters';
import type { EnemyKind } from './enemyDefinitions';
import type { AbilityDefinition, AbilityId } from '../abilities/types';
import type { BiomePresentationConfig } from './biomes';
export interface HeroDefinition {
  id: string; name: string; archetype: CharacterId; hp: number; speed: number; armor: number;
  startingAbilities: readonly string[]; skillPool: readonly string[]; asset: string;
  animations: { idle: string; move: string; death?: string };
}
export interface EnemyDefinition {
  id: string; name: string; category: 'regular' | 'guardian' | 'boss' | 'final';
  behavior: EnemyKind; hp: number; damage: number; speed: number;
  score: number; xp: number; radius: number; color: number; asset: string;
  attack: { range: number; cooldown: number; projectileSpeed: number };
  spawn: { enabled: boolean; offspring?: string };
}
export interface SkillDefinition extends Omit<AbilityDefinition, 'id' | 'character'> {
  id: string; behavior: AbilityId; description: string;
  damage: number; damagePerLevel: number; range: number; area: number; areaPerLevel: number; projectileSpeed: number;
  maxLevel: number; damageMultiplier: number; areaMultiplier: number;
  targeting: 'nearest' | 'dense-group' | 'chain' | 'self';
  effect: 'projectile' | 'area' | 'chain' | 'absorb' | 'melee'; asset: string;
}
export interface GameMap { id: string; name: string; asset: string; presentation: BiomePresentationConfig }
export interface WaveDefinition {
  from: number; name: string; interval: number; burst: number; cap: number; elite: number;
  weights: Readonly<Record<string, number>>;
}
