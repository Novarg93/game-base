import type { GameDefinition } from '../config/gameDefinition';
import type { WaveDefinition } from '../config/content';
import type { SeededRandom } from '../utils/SeededRandom';
import { profileAt, spawnCadenceAt } from './DifficultyDirector';
export function configuredProfile(g: GameDefinition, seconds: number): WaveDefinition {
  if (g.difficulty.director === 'survivor') return profileAt(seconds, g.spawn.waves);
  return [...g.spawn.waves].reverse().find(w => seconds >= w.from) ?? g.spawn.waves[0];
}
export function configuredCadence(g: GameDefinition, seconds: number) {
  if (g.difficulty.director === 'survivor') return spawnCadenceAt(seconds, g.spawn.waves);
  return configuredProfile(g, seconds);
}
export function configuredScales(g: GameDefinition, seconds: number) {
  return { hp: 1 + Math.min(3, seconds / 600) * g.difficulty.hpPer600, damage: 1 + Math.min(2, seconds / 900) * g.difficulty.damagePer900 };
}
export function pickConfiguredEnemy(wave: WaveDefinition, rng: SeededRandom): string {
  const entries = Object.entries(wave.weights); let roll = rng.next() * entries.reduce((n, [, weight]) => n + weight, 0);
  for (const [id, weight] of entries) { roll -= weight; if (roll < 0) return id; }
  return entries[entries.length - 1][0];
}
