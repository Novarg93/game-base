import { expect, it } from 'vitest';
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import GameBase from '../../src/GameBase.vue';
it('evaluates and renders the game entry without browser globals or importing Phaser', async () => {
  expect(typeof window).toBe('undefined');
  const html = await renderToString(createSSRApp(GameBase));
  expect(html).toContain('game-base'); expect(html).toContain('game-mount'); expect(html).not.toContain('<canvas');
});
