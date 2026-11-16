import type { VisualTheme, VisualAssetDefinition } from '../types';
import { ASSET_REGISTRY } from '../../assetRegistry';
import { nativeAssetFiles } from './nativeCatalog';
// Native HD packs retain precise multi-page animation manifests in GameArt.
export const defaultTheme: VisualTheme = {
  id: 'default', renderer: 'hd',
  assets: Object.fromEntries(Object.entries(ASSET_REGISTRY).map(([id, spec]) => {
    const file = nativeAssetFiles.find(f => f.key === spec.source.key);
    return [id, {
    id, texture: spec.source.key,
    source: file ? file.data ? { kind: 'atlas', url: file.image, dataUrl: file.data } : { kind: 'image', url: file.image } : { kind: 'generated' },
    dimensions: 'width' in spec.source ? { width: spec.source.width, height: spec.source.height } : { width: 1, height: 1 },
    origin: spec.origin,
    displaySize: { width: (spec.logicalSize?.width ?? 1) * spec.worldScale, height: (spec.logicalSize?.height ?? 1) * spec.worldScale },
    animations: {}, facing: {}, nativeAnimationModule: 'src/game/art/GameArt.ts',
  } satisfies VisualAssetDefinition]; })),
  terrain: { color: 0x293f36, grid: 0x354940 }, projectiles: { friendly: 'fireball', hostile: 'hostile' },
  icons: {}, audio: { samples: {}, music: {} },
};
