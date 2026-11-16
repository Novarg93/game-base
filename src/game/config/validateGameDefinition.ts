import type { GameDefinition } from './gameDefinition';
import { ENEMIES, isBossKind } from './enemyDefinitions';
import { ABILITIES } from '../abilities/definitions';
export function validateGameDefinition(g: GameDefinition): string[] {
  const errors: string[] = [];
  const require = (ok: unknown, message: string) => { if (!ok) errors.push(message); };
  const positive = (n: number) => Number.isFinite(n) && n > 0;
  require(/^[a-z0-9][a-z0-9-]*$/.test(g.id), 'Invalid game ID'); require(g.title.trim(), 'Missing title');
  require(g.heroes[g.defaultHero], 'Unknown default hero'); require(g.maps[g.defaultMap], 'Unknown default map');
  require(positive(g.runDuration), 'Invalid run duration');
  require(Number.isInteger(g.progression.maxLevel), 'Invalid max level');
  for (const [key, n] of Object.entries(g.progression)) require(positive(n), `Invalid progression ${key}`);
  for (const [key, n] of Object.entries(g.combat)) require(positive(n), `Invalid combat ${key}`);
  require(positive(g.spawn.rate), 'Invalid spawn rate');
  require(['survivor','waves'].includes(g.difficulty.director) && Number.isFinite(g.difficulty.hpPer600) && g.difficulty.hpPer600 >= 0 && Number.isFinite(g.difficulty.damagePer900) && g.difficulty.damagePer900 >= 0, 'Invalid difficulty');
  for (const key of ['regularCap','projectileCap','effectCap','orbCap'] as const) require(Number.isInteger(g.combat[key]), `Invalid integer budget ${key}`);
  require(g.victory.type !== 'kills' || Number.isInteger(g.victory.target) && g.victory.target > 0, 'Invalid victory target');
  const asset = (id: string, owner: string) => { for (const mode of ['default', 'primitive'] as const) require(g.themes[mode]?.assets[id], `Unknown ${mode} asset ${id} in ${owner}`); };
  for (const [id, h] of Object.entries(g.heroes)) {
    require(id === h.id && positive(h.hp) && positive(h.speed) && h.armor >= 0 && h.armor < 1, `Invalid hero ${id}`);
    require(h.archetype === 'mage' || h.archetype === 'warrior', `Unknown hero archetype ${id}`);
    require(h.startingAbilities.length > 0 && h.skillPool.length <= 5, `Invalid skill pool ${id}`);
    const behaviors = h.skillPool.map(s => g.skills[s]?.behavior);
    require(new Set(behaviors).size === behaviors.length, `Duplicate skill behavior in ${id}`);
    for (const s of h.skillPool) require(g.skills[s], `Unknown skill ${s} in ${id}`);
    for (const s of h.startingAbilities) require(h.skillPool.includes(s), `Starting skill ${s} outside ${id} pool`);
    asset(h.asset, id);
  }
  for (const [id, e] of Object.entries(g.enemies)) {
    require(id === e.id && positive(e.hp) && Number.isFinite(e.speed) && e.speed >= 0 && Number.isFinite(e.damage) && e.damage >= 0 && positive(e.radius), `Invalid enemy ${id}`);
    require(ENEMIES[e.behavior], `Unknown enemy behavior ${id}`);
    require(e.category === (e.behavior === 'ashGuard' ? 'final' : e.behavior === 'guardian' ? 'guardian' : isBossKind(e.behavior) ? 'boss' : 'regular'), `Conflicting enemy category ${id}`);
    if (e.spawn.offspring) require(g.enemies[e.spawn.offspring], `Unknown offspring ${id}`);
    asset(e.asset, id);
  }
  for (const [id, s] of Object.entries(g.skills)) {
    require(id === s.id && ABILITIES.some(a => a.id === s.behavior), `Unknown skill behavior ${id}`);
    require(positive(s.cooldown) && Number.isInteger(s.maxLevel) && s.maxLevel >= 1 && s.maxLevel <= 5 && positive(s.damageMultiplier) && positive(s.areaMultiplier) && [s.damage,s.damagePerLevel,s.range,s.area,s.areaPerLevel,s.projectileSpeed].every(n=>Number.isFinite(n)&&n>=0), `Invalid skill ${id}`);
    asset(s.asset, id);
  }
  for (const [id,m] of Object.entries(g.maps)) { require(id===m.id && m.presentation.phases.length>0, `Invalid map ${id}`); asset(m.asset, m.id); }
  require(g.spawn.waves.length > 0 && g.spawn.waves[0]?.from === 0, 'Waves must begin at zero');
  let from = -1;
  for (const w of g.spawn.waves) {
    require(w.from > from && positive(w.interval) && Number.isInteger(w.burst) && w.burst > 0 && positive(w.cap) && w.elite >= 0 && w.elite <= 1, `Invalid wave ${w.name}`); from = w.from;
    require(Object.values(w.weights).some(positive), `Empty wave ${w.name}`);
    for (const [id, weight] of Object.entries(w.weights)) require(g.enemies[id]?.category === 'regular' && g.enemies[id]?.spawn.enabled && Number.isFinite(weight) && weight >= 0, `Invalid wave enemy ${id}`);
  }
  require(g.themes[g.visualMode], 'Unknown visual mode');
  for (const theme of Object.values(g.themes)) {
    require(theme.assets[theme.projectiles.friendly] && theme.assets[theme.projectiles.hostile], `Unknown projectile asset in ${theme.id}`);
    if (theme.terrain.asset) require(theme.assets[theme.terrain.asset], `Unknown terrain asset in ${theme.id}`);
    for (const [id, a] of Object.entries(theme.assets)) {
    require(a.id === id && a.texture && positive(a.dimensions.width) && positive(a.dimensions.height) && positive(a.displaySize.width) && positive(a.displaySize.height), `Invalid asset ${id}`);
    if (a.source.kind !== 'generated') require(a.source.url, `Missing URL ${id}`);
    if (a.source.kind === 'atlas') require(a.source.dataUrl, `Missing atlas data URL ${id}`);
    if (a.source.kind === 'spritesheet') require(positive(a.source.frameWidth) && positive(a.source.frameHeight), `Invalid frame dimensions ${id}`);
    require([a.origin.x,a.origin.y].every(n=>Number.isFinite(n)&&n>=0&&n<=1), `Invalid origin ${id}`);
    for (const c of Object.values(a.animations)) {
      require(positive(c.frameRate) && Number.isInteger(c.frameCount) && c.frameCount > 0, `Invalid animation ${id}/${c.name}`);
      for (const frames of [c.frames, ...Object.values(c.directions ?? {})]) if (frames) require(frames.length === c.frameCount, `Frame count mismatch ${id}/${c.name}`);
    }
  }
  }
  if (g.spawn.encounters || g.victory.type === 'final-boss') for (const kind of ['guardian', 'charger', 'sorcerer', 'eclipse', 'ashGuard']) require(Object.values(g.enemies).some(e => e.behavior === kind && e.spawn.enabled), `Encounter requires ${kind}`);
  return errors;
}
export function assertGameDefinition(g: GameDefinition) { const errors = validateGameDefinition(g); if (errors.length) throw new Error(`Invalid GameDefinition:\n${errors.join('\n')}`); }
