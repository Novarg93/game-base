import type Phaser from 'phaser';
import type { VisualTheme } from './types';
import type { VisualSelection } from '../assetRegistry';
import { animationFrame } from './animation';
import type { World } from '../../systems/World';
export function customAsset(theme: VisualTheme, id: string) {
  const asset = theme.assets[id];
  return asset && !asset.nativeAnimationModule && asset.source.kind !== 'generated' ? asset : undefined;
}
export function customVisual(theme: VisualTheme, id: string, animation: string, age: number, direction = 'south'): (VisualSelection & { flipX: boolean }) | undefined {
  const asset = customAsset(theme,id); if (!asset) return;
  const frame = animationFrame(asset,animation,direction,age);
  return { asset: 'mage', texture: asset.texture, frame: frame.frame === undefined ? undefined : String(frame.frame), scale: 1, dimensions: asset.displaySize, origin: asset.origin, flipX: frame.flipX };
}
export class CustomEffects {
  private sprites = new Map<string, Phaser.GameObjects.Sprite>();
  constructor(private scene: Phaser.Scene, private theme: VisualTheme) {}
  update(w: World) {
    const active = new Set<string>();
    for (const e of [...w.effects, ...w.impacts]) {
      const id = e.source && e.source in w.abilities ? w.skill(e.source as keyof typeof w.abilities).asset : 'kind' in e ? e.kind : '';
      const asset = customAsset(this.theme,id); if (!asset) continue;
      const key = `${'landAt' in e?'impact':'effect'}:${e.id}`;
      active.add(key);
      const view = animationFrame(asset,'effect','south',w.elapsed-('started' in e?e.started:e.launchAt??w.elapsed));
      let sprite = this.sprites.get(key);
      if (!sprite) { sprite = this.scene.add.sprite(e.x,e.y,asset.texture).setDepth(14);this.sprites.set(key,sprite); }
      sprite.setTexture(asset.texture,view.frame).setPosition(e.x,e.y).setOrigin(asset.origin.x,asset.origin.y).setDisplaySize(asset.displaySize.width,asset.displaySize.height).setFlipX(view.flipX);
    }
    for (const [key,sprite] of this.sprites) if (!active.has(key)) { sprite.destroy();this.sprites.delete(key); }
  }
  destroy() { for (const sprite of this.sprites.values()) sprite.destroy();this.sprites.clear(); }
}
