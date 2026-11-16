import type Phaser from 'phaser';
import type { World } from '../../systems/World';
import type { VisualTheme } from './types';
import { assetUrl } from '../assetUrl';
import { animationFrame, facingDirection } from './animation';
import { drawChargePreparation, drawGuardianDanger } from '../EncounterArt';
import { FINAL_BOSS } from '../../config/finalBoss';

export function preloadTheme(scene: Phaser.Scene, theme: VisualTheme, baseUrl: string) {
  for (const a of Object.values(theme.assets)) {
    if (scene.textures.exists(a.texture) || a.source.kind === 'generated' || a.nativeAnimationModule) continue;
    const s = a.source, url = assetUrl(baseUrl, s.url);
    if (s.kind === 'atlas') scene.load.atlas(a.texture, url, assetUrl(baseUrl, s.dataUrl));
    else if (s.kind === 'spritesheet') scene.load.spritesheet(a.texture, url, { frameWidth: s.frameWidth, frameHeight: s.frameHeight });
    else scene.load.image(a.texture, url);
  }
}
// Presentation only: never writes World, calls RNG, applies damage or creates physics bodies.
// One Graphics batch and a bounded sprite map; generated roles need zero external images.
export class GenericPresentation {
  private graphics: Phaser.GameObjects.Graphics;
  private terrain: Phaser.GameObjects.Graphics;
  private images = new Map<string, Phaser.GameObjects.Sprite>();
  private active = new Set<string>();
  private runId = '';
  private deathAge = 0;
  constructor(private scene: Phaser.Scene, private theme: VisualTheme) {
    this.graphics = scene.add.graphics().setDepth(10);
    this.terrain = scene.add.graphics().setDepth(-30);
    scene.cameras.main.setBackgroundColor(theme.terrain.color);
  }
  private asset(key: string, assetId: string, x: number, y: number, animation: string, age: number, direction = 'south', alpha = 1) {
    const a = this.theme.assets[assetId];
    if (!a || a.source.kind === 'generated' || a.nativeAnimationModule) return false;
    this.active.add(key);
    let sprite = this.images.get(key);
    if (!sprite) { sprite = this.scene.add.sprite(x, y, a.texture); this.images.set(key, sprite); }
    const frame = animationFrame(a, animation, direction, age);
    sprite.setTexture(a.texture, frame.frame).setPosition(x,y).setOrigin(a.origin.x,a.origin.y)
      .setDisplaySize(a.displaySize.width,a.displaySize.height).setFlipX(frame.flipX).setAlpha(alpha).setDepth(10 + y / 10000);
    return true;
  }
  render(w: World, moving: boolean) {
    const g = this.graphics.clear(), terrain = this.terrain.clear(), camera = this.scene.cameras.main;
    if (this.runId !== w.runId) { this.runId = w.runId; this.deathAge = 0; }
    if (w.status === 'over') this.deathAge += Math.min(.05,this.scene.game.loop.delta/1000);
    this.active.clear();
    const view = camera.worldView, size = 64;
    terrain.lineStyle(1, this.theme.terrain.grid, .6);
    for (let x = Math.floor(view.left / size) * size; x <= view.right + size; x += size) terrain.lineBetween(x,view.top,x,view.bottom);
    for (let y = Math.floor(view.top / size) * size; y <= view.bottom + size; y += size) terrain.lineBetween(view.left,y,view.right,y);
    const mapAsset = this.theme.assets[w.map.asset];
    const terrainAsset = this.theme.terrain.asset ?? (mapAsset?.source.kind !== 'generated' && !mapAsset?.nativeAnimationModule ? w.map.asset : undefined);
    if (terrainAsset) for (let y = Math.floor(view.top / size) * size; y <= view.bottom; y += size) for (let x = Math.floor(view.left / size) * size; x <= view.right; x += size) {
      if (this.asset(`tile:${x}:${y}`,terrainAsset,x,y,'idle',0)) this.images.get(`tile:${x}:${y}`)!.setDepth(-25).setDisplaySize(size,size);
    }
    const direction = facingDirection(w.facing.x,w.facing.y);
    const heroAnimation = w.status === 'over' ? w.hero.animations.death ?? w.hero.animations.idle : moving ? w.hero.animations.move : w.hero.animations.idle;
    if (!this.asset('hero',w.hero.asset,w.player.x,w.player.y,heroAnimation,w.status==='over'?this.deathAge:w.elapsed,direction)) {
      g.fillStyle(w.character === 'mage' ? 0x69dbff : 0xffd166).fillCircle(w.player.x,w.player.y,9);
      g.lineStyle(2,0xffffff).lineBetween(w.player.x,w.player.y,w.player.x+w.facing.x*15,w.player.y+w.facing.y*15);
    }
    g.fillStyle(0x14212c).fillRect(w.player.x-16,w.player.y-22,32,4);
    g.fillStyle(0x75e6a0).fillRect(w.player.x-16,w.player.y-22,32*Math.max(0,w.player.hp/w.effectiveMaxHp),4);
    if (w.absorb > 0) g.lineStyle(2,0x9abfff,.8).strokeCircle(w.player.x,w.player.y,15);
    for (const e of w.enemies) {
      const definition = w.enemyDefinition(e.definitionId ?? e.kind)!;
      if (!this.asset(`enemy:${e.id}`,definition.asset,e.x,e.y,e.speed?'walk':'idle',w.elapsed-e.born,facingDirection(w.player.x-e.x,w.player.y-e.y))) {
        g.fillStyle(definition.color);
        if (e.boss) g.fillRect(e.x-e.radius,e.y-e.radius,e.radius*2,e.radius*2);
        else if (e.kind === 'guardian') g.fillTriangle(e.x,e.y-e.radius,e.x-e.radius,e.y+e.radius,e.x+e.radius,e.y+e.radius);
        else g.fillCircle(e.x,e.y,e.radius);
        g.lineStyle(e.elite?3:1,e.elite?0xff5d8f:0x101923).strokeCircle(e.x,e.y,e.radius+2);
      }
      if (e.boss || e.kind === 'guardian') g.fillStyle(0xff8f96).fillRect(e.x-20,e.y-e.radius-8,40*e.hp/e.maxHp,3);
      drawChargePreparation(g,w,e);
    }
    for (const e of w.guardians) drawGuardianDanger(g,w,w.guardianSystem.encounters.get(e.id) ?? null,e.id);
    for (const p of w.projectiles) {
      const id = p.hostile ? this.theme.projectiles.hostile : p.source && p.source in w.abilities ? w.skill(p.source as keyof typeof w.abilities).asset : this.theme.projectiles.friendly;
      if (!this.asset(`shot:${p.id}`,id,p.x,p.y,'flight',w.elapsed-(p.started??0))) g.fillStyle(p.hostile?0xff587b:0xffd166).fillCircle(p.x,p.y,p.hostile?4:3);
    }
    for (const orb of w.orbs) g.fillStyle(0x50e5e5).fillRect(orb.x-2,orb.y-2,4,4);
    for (const item of w.loot.items) g.fillStyle(item.lootKind==='healing'?0x6aff99:0xffbaff).fillCircle(item.x,item.y,6);
    for (const c of w.loot.chests) g.fillStyle(0xe6b566).fillRect(c.x-7,c.y-5,14,10);
    for (const a of w.artifacts.items) g.fillStyle(0xffe5a3).fillTriangle(a.x,a.y-7,a.x-6,a.y+5,a.x+6,a.y+5);
    for (const z of w.zones) {
      g.fillStyle(z.ownerId===undefined?0xffb347:0xff587b,.2).fillCircle(z.x,z.y,z.radius);
      if(z.wall) g.lineStyle(z.wall.width,0xffb347,.5).lineBetween(z.wall.from.x,z.wall.from.y,z.wall.to.x,z.wall.to.y);
    }
    for (const i of w.impacts) g.lineStyle(2,i.hostile?0xff587b:0xffd166,.9).strokeCircle(i.x,i.y,i.radius);
    for (const e of w.effects) {
      const alpha = Math.max(0,1-(w.elapsed-e.started)/e.duration);
      const id = e.source && e.source in w.abilities ? w.skill(e.source as keyof typeof w.abilities).asset : e.kind;
      if (this.asset(`effect:${e.id}`,id,e.x,e.y,'effect',w.elapsed-e.started,'south',alpha)) continue;
      g.lineStyle(2,e.color,alpha).strokeCircle(e.x,e.y,e.radius);
      if(e.target) g.lineBetween(e.x,e.y,e.target.x,e.target.y);
    }
    if (w.mobility.remaining > 0) g.lineStyle(3,0x79caff,.8).lineBetween(w.mobility.from.x,w.mobility.from.y,w.player.x,w.player.y);
    if (w.ultimate.casting || w.elapsed < w.ultimate.activeUntil) g.lineStyle(3,0xffefb0,.6).strokeCircle(w.player.x,w.player.y,45);
    const cleave=w.warrior.cleave;
    if(cleave) g.lineStyle(3,0xffe5b0,.9).strokeCircle(w.player.x,w.player.y,38);
    if (w.finalEncounter.active) {
      g.lineStyle(2,0xffd166,.8).strokeCircle(w.finalEncounter.center.x,w.finalEncounter.center.y,FINAL_BOSS.arenaRadius);
      for (const d of w.finalEncounter.dangers()) {
        g.lineStyle(d.at>0?2:4,0xff587b,.85).fillStyle(0xff587b,.15);
        if(d.kind==='circle')g.fillCircle(d.center.x,d.center.y,d.radius).strokeCircle(d.center.x,d.center.y,d.radius);
        else if(d.kind==='strip')g.lineStyle(d.radius*2,0xff587b,.25).lineBetween(d.from.x,d.from.y,d.to.x,d.to.y);
        else { const angle=Math.atan2(d.aim.y,d.aim.x);g.beginPath().moveTo(d.center.x,d.center.y).arc(d.center.x,d.center.y,d.radius,angle-d.angle/2,angle+d.angle/2).closePath().fillPath().strokePath(); }
      }
    }
    for (const [key,sprite] of this.images) if(!this.active.has(key)){sprite.destroy();this.images.delete(key);}
  }
  diagnostics() { return { renderer: 'generic', images: this.images.size, objects: this.scene.children.length, textures: this.scene.textures.getTextureKeys() }; }
  destroy() { this.graphics.destroy();this.terrain.destroy();for(const s of this.images.values())s.destroy();this.images.clear(); }
}
