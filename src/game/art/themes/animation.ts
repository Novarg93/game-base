import type { VisualAssetDefinition } from './types';
export function facingDirection(x: number, y: number) {
  if (x === 0 && y === 0) return 'south';
  return ['east','south-east','south','south-west','west','north-west','north','north-east'][Math.round(Math.atan2(y,x)/(Math.PI/4)+8)%8];
}
export function animationFrame(asset: VisualAssetDefinition, animation: string, direction: string, age: number) {
  const clip = asset.animations[animation];
  const facing = asset.facing[direction] ?? { direction };
  if (!clip) return { frame: undefined, flipX: facing.flipX ?? false };
  const frames = clip.directions?.[facing.direction] ?? clip.frames;
  const raw = Math.floor(Math.max(0, age) * clip.frameRate);
  const index = clip.loop === false ? Math.min(clip.frameCount - 1, raw) : raw % clip.frameCount;
  return { frame: frames?.[index] ?? index, flipX: facing.flipX ?? false };
}
