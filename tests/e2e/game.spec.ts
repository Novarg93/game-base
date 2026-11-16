import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

async function ready(page: Page, mode: string) {
  await page.goto(`/?test=1&visual=${mode}`);
  await expect(page.getByRole('button',{name:'Начать забег'})).toBeVisible({timeout:60000});
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__?.world.status)).toBe('menu');
}
async function start(page: Page) {
  await page.getByRole('button',{name:'Начать забег'}).click();
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__?.world.status)).toBe('playing');
}
for (const mode of ['default','primitive']) for (const mobile of [false,true]) {
  test(`${mode} ${mobile?'mobile landscape':'desktop'}: movement, upgrade, defeat and restart`, async ({ page }) => {
    const errors:string[]=[], failed:string[]=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)failed.push(`${r.status()} ${r.url()}`);});
    if(mobile){await page.setViewportSize({width:915,height:412});await page.addInitScript(()=>{Object.defineProperty(navigator,'maxTouchPoints',{get:()=>1});const native=window.matchMedia;window.matchMedia=q=>q==='(pointer: coarse)'?{...native(q),matches:true}:native(q);});}
    await ready(page,mode);
    await expect(page.locator('canvas')).toHaveCount(1);
    await expect(page.getByRole('heading',{name:'Game Base',exact:true})).toBeVisible();
    await start(page);
    const id=await page.evaluate(()=>window.__PIXEL__!.world.runId);
    const x=await page.evaluate(()=>window.__PIXEL__!.world.player.x);
    await page.keyboard.down('d');await page.waitForTimeout(350);await page.keyboard.up('d');
    expect(await page.evaluate(()=>window.__PIXEL__!.world.player.x)).toBeGreaterThan(x+15);
    if (mobile) {
      const stick = (await page.locator('.joystick').boundingBox())!;
      const before = await page.evaluate(()=>window.__PIXEL__!.world.player.x);
      await page.mouse.move(stick.x+stick.width/2,stick.y+stick.height/2);await page.mouse.down();
      await page.mouse.move(stick.x+stick.width*.9,stick.y+stick.height/2);await page.waitForTimeout(250);await page.mouse.up();
      expect(await page.evaluate(()=>window.__PIXEL__!.world.player.x)).toBeGreaterThan(before+10);
    }
    await page.evaluate(()=>window.__PIXEL__!.world.gainXp(20));
    await expect(page.locator('[data-upgrade]')).toHaveCount(3);
    await page.locator('[data-upgrade]').first().click();
    await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.status)).toBe('playing');
    await page.evaluate(()=>{
      const w=window.__PIXEL__!.world;w.spawn('tank',{x:w.player.x+95,y:w.player.y-45});w.spawn('runner',{x:w.player.x-85,y:w.player.y+60});w.spawn('charger',{x:w.player.x+160,y:w.player.y+40});w.dropXp({x:w.player.x-28,y:w.player.y+20},5);w.effect('frost',{x:w.player.x+75,y:w.player.y-40},45,0x8edfff,.7);
    });
    await page.waitForTimeout(120);
    mkdirSync('screenshots',{recursive:true});await page.screenshot({path:`screenshots/${mode}-${mobile?'mobile':'desktop'}.png`});
    const measured=await page.evaluate(()=>({metrics:window.__PIXEL__!.metrics(),presentation:window.__PIXEL__!.presentation(),artBytes:window.__PIXEL__!.art()?.textureBytes??0}));
    if(mode==='primitive'){expect(measured.presentation.renderer).toBe('generic');expect(measured.presentation.textures).toEqual([]);}
    else expect(measured.presentation.textures).toContain('hd-core');
    writeFileSync(`screenshots/${mode}-${mobile?'mobile':'desktop'}.json`,JSON.stringify(measured,null,2));
    await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.player.invulnerableUntil=0;w.damagePlayer(100000);});
    await expect(page.getByRole('button',{name:'Начать заново'})).toBeVisible();
    await page.getByRole('button',{name:'Начать заново'}).click();
    await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.status)).toBe('playing');
    expect(await page.evaluate(()=>window.__PIXEL__!.world.runId)).not.toBe(id);
    expect(await page.evaluate(()=>window.__PIXEL__!.world.experience.level)).toBe(1);
    expect(errors).toEqual([]);expect(failed).toEqual([]);
  });
}
test('Warrior remains selectable and playable',async({page})=>{
  await ready(page,'default');await page.getByRole('button',{name:'Warrior 150 HP'}).click();await start(page);
  expect(await page.evaluate(()=>({hero:window.__PIXEL__!.world.character,hp:window.__PIXEL__!.world.player.hp,rank:window.__PIXEL__!.world.abilities.cleave.level}))).toEqual({hero:'warrior',hp:150,rank:1});
});
test('Vue mount/unmount, scene restart and listener cleanup',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await ready(page,'primitive');
  const initial=await page.evaluate(()=>window.__PIXEL__!.listeners());
  for(let i=0;i<2;i++){
    await page.evaluate(()=>window.__PIXEL__!.restartScene());
    await expect.poll(()=>page.evaluate(()=>window.__PIXEL__?.listeners())).toEqual(initial);
  }
  for(let i=0;i<2;i++){
    const sizes=await page.evaluate(async()=>{const b=await window.__GAME_BASE_DEMO__!.unmount();return Object.fromEntries(Object.entries(b).filter(([,v])=>typeof v==='object'&&'size'in v).map(([k,v])=>[k,(v as {size:number}).size]));});
    expect(Object.values(sizes).every(n=>n===0)).toBe(true);
    await expect(page.locator('canvas')).toHaveCount(0);await expect.poll(()=>page.evaluate(()=>typeof window.__PIXEL__)).toBe('undefined');
    await page.evaluate(()=>window.__GAME_BASE_DEMO__!.mount());await expect(page.getByRole('button',{name:'Начать забег'})).toBeVisible();
    await expect.poll(()=>page.evaluate(()=>window.__PIXEL__?.listeners())).toEqual(initial);
    await expect(page.locator('canvas')).toHaveCount(1);
  }
  await page.locator('.game-base').evaluate(el=>{(el as HTMLElement).style.width='800px';(el as HTMLElement).style.height='400px';});
  await expect.poll(()=>page.locator('canvas').evaluate(el=>({w:(el as HTMLCanvasElement).width,h:(el as HTMLCanvasElement).height}))).toEqual({w:800,h:400});
  expect(errors).toEqual([]);
});
test('development selector replaces Phaser and CSS stays inside game root',async({page})=>{
  await ready(page,'primitive');await page.getByLabel('Visual mode').selectOption('default');
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__?.presentation().renderer),{timeout:60000}).toBe('hd');
  await expect(page.locator('canvas')).toHaveCount(1);
  const style=await page.evaluate(()=>{const b=document.createElement('button');b.textContent='Host';document.body.appendChild(b);const c=getComputedStyle(b);return{padding:c.padding,shadow:c.boxShadow};});
  expect(style.shadow).toBe('none');expect(style.padding).not.toBe('14px 23px');
});
test('second game uses content IDs, custom animated artwork and configured victory',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?test=1&game=example&visual=default');
  await expect(page.getByRole('heading',{name:'Orbital Survivor',exact:true})).toBeVisible({timeout:60000});
  await start(page);
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art()?.heroFrame)).toMatch(/^runner-right-/);
  const state=await page.evaluate(()=>{const w=window.__PIXEL__!.world;return{hero:w.heroId,map:w.mapId,name:w.snapshot().abilities[0].name,hp:w.player.maxHp};});
  expect(state).toEqual({hero:'pilot',map:'orbit',name:'Plasma',hp:120});
  await page.evaluate(()=>{window.__PIXEL__!.world.elapsed=60;});
  await expect(page.getByRole('heading',{name:'Победа!'})).toBeVisible();
  await expect(page.locator('.record-map').first()).toHaveText('Orbit');
  await page.screenshot({path:'screenshots/example-game.png'});expect(errors).toEqual([]);
});
