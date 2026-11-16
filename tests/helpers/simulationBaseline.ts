import { createHash } from 'node:crypto';
import type { World } from '../../src/game/systems/World';
import type { CharacterId } from '../../src/game/config/characters';
export function simulationBaseline(Factory: typeof World, character: CharacterId) {
  const w = new Factory(81273,{character});
  w.player.invulnerableUntil = Infinity;
  for (const def of w.abilityDefinitions) w.abilities[def.id].level = 3;
  for (let i=0;i<2400;i++) {
    if(w.status==='upgrade')w.selectUpgrade(w.choices[0].id);
    w.step(.05,{x:Math.cos(i/170),y:Math.sin(i/170)});
  }
  const state = {
    player:w.player,stats:w.stats,abilities:w.abilities,upgrades:w.upgrades,
    enemies:w.enemies.map(e=>Object.fromEntries(Object.entries(e).filter(([k])=>k!=='definitionId'))),
    projectiles:w.projectiles,orbs:w.orbs,elapsed:w.elapsed,kills:w.kills,score:w.score,
    experience:{level:w.experience.level,xp:w.experience.xp,pending:w.experience.pending},
    spawned:w.spawnedRegular,rng:w.rng.next(),
  };
  return { character, kills:w.kills,score:w.score,level:w.experience.level,elapsed:w.elapsed,hash:createHash('sha256').update(JSON.stringify(state)).digest('hex') };
}
