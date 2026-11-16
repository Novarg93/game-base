import { expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { exampleGame } from '../../src/games/exampleGame';
import { defaultGameDefinition as base, validateGameDefinition } from '../../src/game/config/gameDefinition';
import { World } from '../../src/game/systems/World';
import { nativeAssetFiles } from '../../src/game/art/themes/default/nativeCatalog';
import { configuredCadence, configuredProfile } from '../../src/game/systems/RunDirector';

it('ships a complete independent example game',()=>{
  expect(validateGameDefinition(exampleGame)).toEqual([]);
  const w=new World(2,{definition:exampleGame});
  for(let i=0;i<60;i++)w.step(.05);
  expect(w.heroId).toBe('pilot');expect(w.mapId).toBe('orbit');
  expect(w.enemies.every(e=>e.definitionId==='drone')).toBe(true);expect(w.enemies.length).toBeGreaterThan(0);
});
it('preserves native pacing when configuration crosses a serialization boundary',()=>{
  const copy=structuredClone(base);
  for(const at of [0,60,600,900,1200,1800]){
    expect(configuredProfile(copy,at)).toEqual(configuredProfile(base,at));
    expect(configuredCadence(copy,at)).toEqual(configuredCadence(base,at));
  }
});
it('keeps every native loader input in public assets',()=>{
  expect(new Set(nativeAssetFiles.map(f=>f.key)).size).toBe(nativeAssetFiles.length);
  for(const file of nativeAssetFiles){expect(existsSync(`public/${file.image}`),file.image).toBe(true);if(file.data)expect(existsSync(`public/${file.data}`),file.data).toBe(true);}
});
it('uses content radius independently of visual dimensions',()=>{
  const g={...base,themes:{...base.themes,primitive:{...base.themes.primitive,assets:{...base.themes.primitive.assets,grunt:{...base.themes.primitive.assets.grunt,displaySize:{width:1000,height:1000}}}}}};
  expect(new World(1,{definition:g}).spawn('grunt')!.radius).toBe(10);
});
it('starts the final encounter at configured duration and finishes its existing death sequence',()=>{
  const w=new World(1,{definition:{...base,runDuration:.1}});w.player.invulnerableUntil=Infinity;
  w.step(.05);w.step(.05);expect(w.finalEncounter.phase).toBe('intro');expect(w.finalEncounter.boss!.maxHp).toBe(108000);
  // Isolate the lethal phase; ritual gates and movement remain the native behavior.
  w.finalEncounter.phase='phase3';w.finalEncounter.pending=null;
  w.damageEnemy(w.finalEncounter.boss!,1000000);
  expect(w.outcome).toBe('victory');expect(w.finalEncounter.phase).toBe('dying');
  for(let i=0;i<200 && w.status!=='over';i++)w.step(.05);
  expect(w.status).toBe('over');expect(w.finalEncounter.phase).toBe('defeated');
});
