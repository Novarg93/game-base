import { ABILITIES } from '../abilities/definitions';
import type { SkillDefinition } from './content';
import { WARRIOR_CAST } from './warriorAbilities';
const damage = { fireball:24, frost:10, lightning:22, meteor:55, shield:0, cleave:26, whirlwind:9, slam:45, blades:30, iron:0 };
const scaling = { fireball:.2, frost:6, lightning:9, meteor:25, shield:0, cleave:8, whirlwind:4, slam:15, blades:12, iron:0 };
const range = { fireball:310, frost:310, lightning:280, meteor:310, shield:0, cleave:82, whirlwind:68, slam:160, blades:WARRIOR_CAST.throwRange, iron:0 };
const area = { fireball:1, frost:73, lightning:115, meteor:48, shield:1, cleave:82, whirlwind:68, slam:52, blades:WARRIOR_CAST.spearHitRadius, iron:1 };
export const skills: Readonly<Record<string, SkillDefinition>> = Object.fromEntries(ABILITIES.map(a => [a.id, {
  ...a, behavior: a.id, description: a.description ?? a.name,
  damage: damage[a.id], damagePerLevel: scaling[a.id], range: range[a.id], area: area[a.id],
  areaPerLevel: a.id === 'meteor' ? 7 : a.id === 'slam' ? 5 : 0,
  projectileSpeed: a.id === 'blades' ? WARRIOR_CAST.spearSpeed : 270,
  damageMultiplier: 1, areaMultiplier: 1, maxLevel: 5,
  targeting: a.id === 'lightning' ? 'chain' : a.id === 'shield' || a.id === 'iron' ? 'self' : a.id === 'frost' || a.id === 'meteor' ? 'dense-group' : 'nearest',
  effect: a.id === 'fireball' || a.id === 'blades' ? 'projectile' : a.id === 'lightning' ? 'chain' : a.id === 'shield' || a.id === 'iron' ? 'absorb' : a.id === 'cleave' ? 'melee' : 'area',
  asset: a.id,
} satisfies SkillDefinition]));
