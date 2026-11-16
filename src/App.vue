<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from 'vue';
import GameBase from './GameBase.vue';
import type { VisualMode } from './game/art/themes/types';
import { exampleGame } from './games/exampleGame';
import { defaultGameDefinition } from './game/config/gameDefinition';
const dev = import.meta.env.DEV;
const query = dev && typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
const definition = dev && query.get('game') === 'example' ? exampleGame : defaultGameDefinition;
const mode = ref<VisualMode>(query.get('visual') === 'primitive' ? 'primitive' : query.get('visual') === 'default' ? 'default' : definition.visualMode);
const visible = ref(true), entry = ref<InstanceType<typeof GameBase>>();
onMounted(() => { if (dev && new URLSearchParams(location.search).get('test') === '1') window.__GAME_BASE_DEMO__ = { unmount: async () => { const bridge = entry.value!.bridge; visible.value = false; await nextTick(); return bridge; }, mount: async () => { visible.value = true; await nextTick(); }, bridge: () => entry.value!.bridge }; });
onUnmounted(() => { delete window.__GAME_BASE_DEMO__; });
</script>
<template><GameBase v-if="visible" :key="mode" ref="entry" :definition="definition" :visual-mode="mode" :development-tools="dev" />
<label v-if="dev" class="demo-tools">Visual mode <select v-model="mode" aria-label="Visual mode"><option value="default">Default HD</option><option value="primitive">Primitive</option></select></label></template>
<style scoped>.demo-tools{position:fixed;right:12px;bottom:4px;z-index:20000;background:#12202a;color:#eee;padding:3px 7px;font:11px monospace;opacity:.85}.demo-tools select{font:inherit}</style>
