import { describe, expect, it } from 'vitest';
import { defaultGameDefinition as base, validateGameDefinition } from '../../src/game/config/gameDefinition';
import { World } from '../../src/game/systems/World';
import { chooseUpgrades, eligibleUpgrades, applyUpgrade } from '../../src/game/systems/UpgradeSystem';
import { configuredProfile } from '../../src/game/systems/RunDirector';
import { fireball } from '../../src/game/abilities/fireball';

describe('game definition and preserved baseline', () => {
  it('validates every default reference', () => expect(validateGameDefinition(base)).toEqual([]));
  it('reports missing hero, skill, enemy, map and art references', () => {
    const broken = { ...base, defaultMap: 'missing', defaultHero: 'missing', heroes: { mage: { ...base.heroes.mage, asset: 'missing', skillPool: ['missing'], startingAbilities: ['other'] } }, spawn: { ...base.spawn, waves: [{ ...base.spawn.waves[0], weights: { missing: 1 } }] } };
    expect(validateGameDefinition(broken).join('\n')).toMatch(/Unknown default map/);
    expect(validateGameDefinition(broken).length).toBeGreaterThanOrEqual(6);
  });
  it.each([['mage', 100, 135, 'fireball'], ['warrior', 150, 118, 'cleave']] as const)('preserves %s stats and starting skill', (character, hp, speed, ability) => {
    const w = new World(7, { character });
    expect(w.player).toMatchObject({ hp, maxHp: hp, speed });
    expect(w.abilities[ability].level).toBe(1);
    expect(Object.values(w.abilities).filter(a => a.level > 0)).toHaveLength(1);
  });
  it('supports independent hero, enemy and skill content IDs', () => {
    const definition = { ...base, defaultHero: 'pilot', heroes: { pilot: { ...base.heroes.mage, id: 'pilot', hp: 210, startingAbilities: ['plasma'], skillPool: ['plasma'] } }, skills: { plasma: { ...base.skills.fireball, id: 'plasma', name: 'Plasma', damage: 100 } }, enemies: { drone: { ...base.enemies.grunt, id: 'drone', hp: 140 } }, spawn: { rate: 1, encounters: false, waves: [{ ...base.spawn.waves[0], weights: { drone: 1 } }] }, victory: { type: 'survive' as const } };
    expect(validateGameDefinition(definition)).toEqual([]);
    const w = new World(7, { definition });
    const drone = w.spawn('drone', { x: 100, y: 0 })!;
    expect(w.heroId).toBe('pilot'); expect(w.player.hp).toBe(210); expect(drone).toMatchObject({ kind: 'grunt', definitionId: 'drone', hp: 140 });
    expect(w.snapshot().abilities[0].name).toBe('Plasma');
    fireball(w); expect(w.projectiles[0].damage).toBe(100);
  });
  it('preserves configured enemy stats, elite multipliers and spawn cap', () => {
    const w = new World(8); const e = w.spawn('tank', { x: 100, y: 0 }, true)!;
    expect(e).toMatchObject({ hp: 210, damage: 25.2, radius: 18.75 });
    for (let i = 0; i < 200; i++) w.spawn('grunt');
    expect(w.regularCount).toBe(35); expect(configuredProfile(base, 300).cap).toBe(120);
  });
});
describe('simulation and upgrades', () => {
  it('keeps choices distinct, eligible and seeded', () => {
    const a = new World(91), b = new World(91);
    expect(chooseUpgrades(a).map(c => c.id)).toEqual(chooseUpgrades(b).map(c => c.id));
    expect(new Set(chooseUpgrades(a).map(c => c.id)).size).toBe(3);
    expect(eligibleUpgrades(a).some(c => c.id === 'unlock-cleave')).toBe(false);
    expect(applyUpgrade(a, 'unlock-cleave')).toBe(false);
    a.abilities.fireball.level = 5; expect(eligibleUpgrades(a).some(c => c.id === 'rank-fireball')).toBe(false);
  });
  it('applies armor, invulnerability and one fatal transition', () => {
    const w = new World(2, { character: 'warrior' });
    expect(w.damagePlayer(100)).toBe(true); expect(w.player.hp).toBeCloseTo(68);
    expect(w.damagePlayer(100)).toBe(false);
    w.elapsed = 1; w.damagePlayer(100); expect(w.outcome).toBe('defeat'); expect(w.status).toBe('over');
    w.step(1); expect(w.elapsed).toBe(1);
  });
  it('pauses at level-up, rejects stale choices, respects max level', () => {
    const definition = { ...base, progression: { ...base.progression, maxLevel: 2 } };
    const w = new World(1, { definition }); w.gainXp(100);
    expect(w.status).toBe('upgrade'); expect(w.experience.level).toBe(2);
    expect(w.selectUpgrade(w.choices[0].id, w.offerId - 1)).toBe(false);
    expect(w.selectUpgrade(w.choices[0].id)).toBe(true); expect(w.status).toBe('playing');
    w.gainXp(100000); expect(w.experience.level).toBe(2);
  });
  it('supports survival victory and creates fresh runs', () => {
    const definition = { ...base, runDuration: .1, victory: { type: 'survive' as const } };
    const w = new World(1, { definition }); w.step(.05); w.step(.05);
    expect(w.outcome).toBe('victory'); expect(w.status).toBe('over');
    const next = new World(1, { definition }); expect(next.runId).not.toBe(w.runId); expect(next.elapsed).toBe(0); expect(next.outcome).toBe(null);
  });
});
