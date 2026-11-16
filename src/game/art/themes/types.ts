export type VisualMode = 'default' | 'primitive';
export interface AnimationDefinition {
  name: string; frameCount: number; frameRate: number; frames?: readonly (string | number)[];
  directions?: Readonly<Record<string, readonly (string | number)[]>>; loop?: boolean;
}
export interface VisualAssetDefinition {
  id: string; texture: string;
  source: { kind: 'image'; url: string } | { kind: 'atlas'; url: string; dataUrl: string }
    | { kind: 'spritesheet'; url: string; frameWidth: number; frameHeight: number } | { kind: 'generated' };
  dimensions: { width: number; height: number }; animations: Readonly<Record<string, AnimationDefinition>>;
  facing: Readonly<Record<string, { direction: string; flipX?: boolean }>>;
  origin: { x: number; y: number }; displaySize: { width: number; height: number };
  nativeAnimationModule?: string;
  // Suggested authoring geometry; simulation collision remains in content definitions.
  hitbox?: { radius: number; offsetX?: number; offsetY?: number };
}
export interface VisualTheme {
  id: string; renderer: 'hd' | 'generic'; assets: Readonly<Record<string, VisualAssetDefinition>>;
  terrain: { color: number; grid: number; asset?: string };
  projectiles: { friendly: string; hostile: string }; icons: Readonly<Record<string, string>>;
  audio: { samples: Readonly<Record<string, string>>; music: Readonly<Record<string, string>> };
}
