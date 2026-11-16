import { describe, expect, it } from 'vitest';
import { defaultGameDefinition as base } from '../../src/game/config/gameDefinition';
import { MemoryPlatformAdapter, MemoryStorage } from '../../src/game/platform/MemoryPlatformAdapter';
import { LocalPlatformAdapter } from '../../src/game/platform/LocalPlatformAdapter';
import { loadProfile, saveProfile, runRecord, validRecord, type StoragePort } from '../../src/game/services/storage';
import { World } from '../../src/game/systems/World';
import { createGameBridge } from '../../src/game/events/bridge';
import { animationFrame, facingDirection } from '../../src/game/art/themes/animation';
import { assetUrl } from '../../src/game/art/assetUrl';

describe('local platform boundary', () => {
  it('records a completed run once, persists settings and isolates game IDs', async () => {
    const storage = new MemoryStorage(), adapter = new LocalPlatformAdapter(base, storage);
    const w = new World(); w.damagePlayer(1000); const record = runRecord(w.snapshot());
    expect(validRecord(record)).toBe(true);
    expect(validRecord({...record,details:{...record.details,mapName:42}})).toBe(false);
    const request = { gameId: base.id, clientRunId: w.runId, heroId: w.heroId, mapId: w.mapId };
    const run = await adapter.startRun(request); expect(await adapter.startRun(request)).toBe(run);
    await adapter.finishRun(run, record); await adapter.finishRun(run, record);
    await adapter.submitRunStatistics(run,{kills:0,score:0,seconds:0});
    const profile = await adapter.loadProfile(); expect(profile.statistics.runs).toBe(1);
    await adapter.saveSettings({ ...profile.settings, muted: true });
    expect((await new LocalPlatformAdapter(base,storage).loadProfile()).settings.muted).toBe(true);
    expect((await new LocalPlatformAdapter({...base,id:'other'},storage).loadProfile()).statistics.runs).toBe(0);
    expect((await adapter.getLeaderboard()).scope).toBe('local');
    expect(await adapter.loadInventory()).toEqual([]);
    expect((await adapter.requestPremiumAction('revive')).supported).toBe(false);
  });
  it('keeps play possible with corrupt or blocked storage', async () => {
    const storage = new MemoryStorage(); storage.setItem('game-base:game-base:v1','{');
    expect(loadProfile(storage).records).toEqual([]);
    const broken: StoragePort = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(loadProfile(broken).statistics.runs).toBe(0); expect(saveProfile(loadProfile(broken),broken)).toBe(false);
    const adapter = new LocalPlatformAdapter(base,broken);
    await expect(adapter.saveSettings({volume:.2,muted:true,pixelScale:2})).rejects.toThrow('storage unavailable');
    expect((await adapter.loadProfile()).settings.muted).toBe(true);
  });
  it('provides isolated memory adapters and rejects invalid run references', async () => {
    const a = new MemoryPlatformAdapter(), b = new MemoryPlatformAdapter();
    await a.saveSettings({volume:.1,muted:true,pixelScale:2});
    expect((await b.loadProfile()).settings.muted).toBe(false);
    await expect(a.startRun({gameId:'bad',clientRunId:'a',heroId:'mage',mapId:'grove'})).rejects.toThrow('Invalid run');
    expect((await a.getPlayerIdentity()).kind).toBe('guest');
  });
});
describe('presentation and lifecycle contracts', () => {
  it('isolates event bridges and removes listeners', () => {
    const a=createGameBridge(), b=createGameBridge(); let calls=0;
    const off=a.commands.on(()=>calls++); b.commands.emit({type:'pause'}); expect(calls).toBe(0);
    a.commands.emit({type:'pause'}); expect(calls).toBe(1); off(); expect(a.commands.size).toBe(0);
    a.commands.on(()=>calls++);a.dispose();expect(a.commands.size).toBe(0);
  });
  it('keeps all primitive asset roles generated and HD roles available', () => {
    const primitive=base.themes.primitive;
    expect(Object.values(primitive.assets).every(a=>a.source.kind==='generated')).toBe(true);
    for(const h of Object.values(base.heroes))expect(primitive.assets[h.asset]).toBeDefined();
    for(const e of Object.values(base.enemies))expect(base.themes.default.assets[e.asset]).toBeDefined();
    expect(base.themes.default.renderer).toBe('hd');expect(primitive.renderer).toBe('generic');
  });
  it('samples independent directional frame layouts, mirroring and non-loop clips', () => {
    const a = { ...base.themes.primitive.assets.mage, facing:{west:{direction:'east',flipX:true}}, animations:{run:{name:'run',frameCount:3,frameRate:4,directions:{east:['e0','e1','e2']},loop:false}} };
    expect(animationFrame(a,'run','west',.3)).toEqual({frame:'e1',flipX:true});
    expect(animationFrame(a,'run','west',10).frame).toBe('e2');
    expect(facingDirection(-1,-1)).toBe('north-west');expect(facingDirection(1,1)).toBe('south-east');
    expect(assetUrl('/games/demo/','assets/a.png')).toBe('/games/demo/assets/a.png');
    expect(assetUrl('/games/demo/','https://example.com/a.png')).toBe('https://example.com/a.png');
  });
  it('produces identical seeded mechanics for both visual modes', () => {
    const a=new World(9), b=new World(9,{definition:{...base,visualMode:'primitive'}});
    for (let i=0;i<400;i++){a.step(.02,{x:1,y:0});b.step(.02,{x:1,y:0});}
    expect(a.enemies).toEqual(b.enemies);expect(a.projectiles).toEqual(b.projectiles);expect(a.player).toEqual(b.player);
    expect(a.experience).toEqual(b.experience);expect(a.rng.next()).toBe(b.rng.next());
  });
});
