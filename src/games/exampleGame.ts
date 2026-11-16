import { defaultGameDefinition as base, type GameDefinition } from '../game/config/gameDefinition';
import type { VisualAssetDefinition } from '../game/art/themes/types';
const exampleHero: VisualAssetDefinition = {
  id: 'mage', texture: 'example-pilot', source: { kind: 'atlas', url: 'assets/hd/runner.png', dataUrl: 'assets/hd/runner.json' },
  dimensions: { width: 64, height: 64 }, origin: { x: .5, y: .5 }, displaySize: { width: 24, height: 24 },
  animations: {
    idle: { name: 'idle', frameCount: 3, frameRate: 3, frames: [0,1,2].map(i=>`runner-right-idle-${i}`) },
    run: { name: 'run', frameCount: 6, frameRate: 12, frames: [0,1,2,3,4,5].map(i=>`runner-right-walk-${i}`) },
  }, facing: { west: { direction: 'east', flipX: true } },
};
// A complete second game using existing behaviors and generated art.
// No changes to World, GameScene, targeting, collision or upgrade internals.
export const exampleGame: GameDefinition = {
  ...base, id: 'orbital-survivor', title: 'Orbital Survivor', description: 'Одна минута на орбите.',
  defaultHero: 'pilot', defaultMap: 'orbit', runDuration: 60, victory: { type: 'survive' },
  heroes: { pilot: { ...base.heroes.mage, id: 'pilot', name: 'Pilot', hp: 120, startingAbilities: ['plasma'], skillPool: ['plasma'] } },
  skills: { plasma: { ...base.skills.fireball, id: 'plasma', name: 'Plasma', description: 'Автоматический плазменный снаряд.', damage: 30, cooldown: .65 } },
  enemies: { drone: { ...base.enemies.grunt, id: 'drone', name: 'Drone', hp: 28, speed: 40 } },
  maps: { orbit: { ...base.maps.grove, id: 'orbit', name: 'Orbit' } },
  difficulty: { ...base.difficulty, director: 'waves' },
  spawn: { rate: 1, encounters: false, waves: [
    { from: 0, name: 'Approach', interval: 1, burst: 1, cap: 35, elite: 0, weights: { drone: 1 } },
    { from: 30, name: 'Swarm', interval: .7, burst: 2, cap: 65, elite: .05, weights: { drone: 1 } },
  ] }, visualMode: 'primitive',
  themes: { ...base.themes, default: { ...base.themes.default, assets: { ...base.themes.default.assets, mage: exampleHero } } },
};
