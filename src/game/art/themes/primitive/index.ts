import type { VisualTheme } from '../types';
import { defaultTheme } from '../default';
export const primitiveTheme: VisualTheme = {
  ...defaultTheme, id: 'primitive', renderer: 'generic',
  assets: Object.fromEntries(Object.entries(defaultTheme.assets).map(([id, a]) => [id, { ...a, texture: `primitive-${id}`, source: { kind: 'generated' } }])),
  terrain: { color: 0x12202a, grid: 0x263846 },
};
