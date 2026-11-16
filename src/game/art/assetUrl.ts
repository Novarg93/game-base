export function assetUrl(base: string, path: string) {
  if (/^(?:https?:|data:|blob:|\/\/)/.test(path)) return path;
  return `${base.replace(/\/?$/, '/')}${path.replace(/^\//, '')}`;
}
