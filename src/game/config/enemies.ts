import { ENEMIES, ENEMY_NAMES, isBossKind, type EnemyKind } from './enemyDefinitions';
import type { EnemyDefinition } from './content';
export const enemies: Readonly<Record<string, EnemyDefinition>> = Object.fromEntries(
  (Object.keys(ENEMIES) as EnemyKind[]).map(id => [id, {
    ...ENEMIES[id], id, name: ENEMY_NAMES[id], behavior: id, asset: id,
    category: id === 'ashGuard' ? 'final' : id === 'guardian' ? 'guardian' : isBossKind(id) ? 'boss' : 'regular',
    attack: { range: 310, cooldown: 0, projectileSpeed: 0 },
    spawn: { enabled: true, ...(id === 'splitter' ? { offspring: 'grunt' } : {}) },
  } satisfies EnemyDefinition]),
);
