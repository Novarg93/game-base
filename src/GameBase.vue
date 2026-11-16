<script setup lang="ts">
import { onMounted, onUnmounted, provide, ref, shallowRef, watch, computed } from 'vue';
import type { createGame } from './game/bootstrap/createGame';
import UltimateControl from './ui/components/UltimateControl.vue';
import { createGameBridge, type InputDevice, type UiScreen, type Metrics } from './game/events/bridge';
import type { Snapshot } from './game/systems/World';
import { loadProfile, runRecord, type Settings } from './game/services/storage';
import LevelUpModal from './ui/components/LevelUpModal.vue';
import FinalBossBar from './ui/components/FinalBossBar.vue';
import BossBars from './ui/components/BossBars.vue';
import MainMenu from './ui/components/MainMenu.vue';
import SettingsPanel from './ui/components/SettingsPanel.vue';
import GameHUD from './ui/components/GameHUD.vue';
import DialogFrame from './ui/components/DialogFrame.vue';
import VirtualJoystick from './ui/components/VirtualJoystick.vue';
import { formatTime } from './ui/format';
import { installUpgradeSpaceGuard } from './ui/upgradeInput';
import RunStatistics from './ui/components/RunStatistics.vue';
import LocalRecords from './ui/components/LocalRecords.vue';
import { defaultGameDefinition, assertGameDefinition, type GameDefinition } from './game/config/gameDefinition';
import type { VisualMode } from './game/art/themes/types';
import type { GamePlatformAdapter, PlatformRun } from './game/platform/GamePlatformAdapter';
import { LocalPlatformAdapter } from './game/platform/LocalPlatformAdapter';
import { MemoryStorage } from './game/platform/MemoryPlatformAdapter';
import { assetUrl } from './game/art/assetUrl';
import { GAME_BRIDGE } from './ui/gameBridge';

import type { PracticeBoss } from './game/config/bossPractice';
import { navigateGamepad, vPad } from './ui/gamepadNavigation';
import { INPUT_DEVICE } from './ui/inputDevice';

import { mobileViewport, MobileFullscreen } from './ui/mobileViewport';
const props = withDefaults(defineProps<{ definition?: GameDefinition; platform?: GamePlatformAdapter; visualMode?: VisualMode; assetBaseUrl?: string; developmentTools?: boolean }>(), { developmentTools: false });
const emit = defineEmits<{ ready: []; 'platform-error': [error: unknown] }>();
const definition = shallowRef(props.definition ?? defaultGameDefinition);
const bridge = createGameBridge();
const { snapshots, commands, metrics, gamepadUi, gamepadNotices, inputDevices } = bridge;
provide(GAME_BRIDGE, bridge);
const themeIcons = computed(() => Object.fromEntries(Object.entries(definition.value.themes[props.visualMode ?? definition.value.visualMode].icons).map(([id,url])=>[id,assetUrl(props.assetBaseUrl ?? import.meta.env.BASE_URL,url)])));
const platform = props.platform ?? new LocalPlatformAdapter(definition.value);
let disposed = false;
const loadError = ref('');
function platformError(error: unknown) { if (!disposed) { storageFailed.value = true; emit('platform-error', error); } }
const runs = new Map<string, Promise<PlatformRun>>();
const viewport = ref(mobileViewport()), fullscreen = new MobileFullscreen();
function resizeViewport() { viewport.value = mobileViewport(); if (game?.isBooted && mount.value) game.scale.setParentSize(mount.value.clientWidth, mount.value.clientHeight); }
const inputDevice = ref<InputDevice>('keyboard');
provide(INPUT_DEVICE, inputDevice);
const shell = ref<HTMLElement>(), controllerNotice = ref('');
let noticeTimer: ReturnType<typeof setTimeout> | undefined;
const offDevice = inputDevices.on(device => { inputDevice.value = device; });
const offNotice = gamepadNotices.on(notice => {
  controllerNotice.value = { connected: 'Геймпад подключён', disconnected: 'Геймпад отключён', unsupported: 'Геймпад: нужны standard mapping, 2 оси и 16 кнопок', unavailable: 'Gamepad API недоступен в этом браузере или контексте' }[notice];
  if (notice === 'disconnected' || notice === 'unsupported' || notice === 'unavailable') inputDevice.value = 'keyboard';
  clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { controllerNotice.value = ''; }, 4000);
});
const character = ref(definition.value.defaultHero);
const biome = ref(definition.value.defaultMap);
function chooseBiome(value: string) { if (!definition.value.maps[value]) return; biome.value=value; commands.emit({type:'preview',biome:biome.value}); }
function chooseCharacter(value: string) { if (!definition.value.heroes[value]) return; character.value = value; commands.emit({type:'preview',character:character.value}); }
const mount = ref<HTMLElement>(), state = ref<Snapshot>();
const debug = import.meta.env.DEV && props.developmentTools && typeof location !== 'undefined' && new URLSearchParams(location.search).get('debug') === '1';
const debugState = ref<Metrics>();
const offMetrics = metrics.on(value => { if (debug) debugState.value = value; });
const profile = ref(loadProfile(new MemoryStorage())), previousBest = ref(profile.value.records[0]?.score ?? 0), storageFailed = ref(false);
const settings = ref(profile.value.settings), screen = ref<UiScreen>('game');
watch(screen, value => commands.emit({ type: 'ui-screen', screen: value }), { flush: 'sync' });
watch(screen, () => {
  const panel = [...shell.value?.querySelectorAll<HTMLElement>('[role="dialog"]') ?? []].at(-1);
  const initial = panel?.querySelector<HTMLElement>('input,button') ?? shell.value?.querySelector<HTMLElement>('.play-button');
  initial?.focus({ preventScroll: true }); initial?.scrollIntoView({ block: 'center' });
}, { flush: 'post' });
const offPadUi = gamepadUi.on(({ scope, action }) => {
  if (scope !== 'shell' || !shell.value) return;
  const panel = [...shell.value.querySelectorAll<HTMLElement>('[role="dialog"]')].at(-1) ?? shell.value.querySelector<HTMLElement>('.menu-content');
  if (panel) navigateGamepad(panel, action);
});
let game: ReturnType<typeof createGame> | undefined;
let offUpgradeSpace: (() => void) | undefined;
let recordedId = '';
const resultsVisible=ref(false);
const off = snapshots.on(value => {
  state.value = value;
  if(value.status!=='over'){resultsVisible.value=false;}
  else resultsVisible.value=true;
  if (value.status !== 'menu' && !value.practice && !runs.has(value.runId) && recordedId !== value.runId) {
    const started = platform.startRun({ gameId: value.gameId, clientRunId: value.runId, heroId: value.heroId, mapId: value.mapId });
    runs.clear(); runs.set(value.runId, started); void started.catch(platformError);
  }
  // Victory is latched at the fatal hit, before the existing death animation completes.
  if ((value.status === 'over' || value.outcome === 'victory') && recordedId !== value.runId) {
    recordedId = value.runId; previousBest.value = profile.value.records[0]?.score ?? 0;
    if (!value.practice) void (async () => {
      try {
        const run = await runs.get(value.runId); if (!run) return;
        const result = runRecord(value);
        await platform.finishRun(run, result);
        await platform.submitRunStatistics(run, { kills: value.kills, score: value.score, seconds: value.elapsed });
      } catch (error) { platformError(error); }
      finally { const next = await platform.loadProfile().catch(error => { platformError(error); return undefined; }); if (!disposed && next) profile.value = next; runs.delete(value.runId); }
    })();
  }
});
function start(){startRun(null);}
function startBossPractice(){startRun('ash-warden');}
function startGuardianPractice(){startRun('rootbound-guardian');}
function victoryTitle(boss:PracticeBoss|undefined){
  if (!state.value?.practice && definition.value.victory.type !== 'final-boss') return 'ЦЕЛЬ ДОСТИГНУТА';
  return boss==='rootbound-guardian'?'ХРАНИТЕЛЬ ПОВЕРЖЕН':boss==='astral-revenant'?'ХРАНИТЕЛЬ ЗАТМЕНИЯ ПОВЕРЖЕН':boss==='briar-beast'?'ТЕРНОВЫЙ ЗВЕРЬ ПОВЕРЖЕН':boss==='rune-warden'?'ХРАНИТЕЛЬ РУН ПОВЕРЖЕН':'СТРАЖ ПОВЕРЖЕН';
}
function restartCurrent(){if(state.value?.practice)startRun(state.value.practiceBoss??'ash-warden');else start();}
function startRun(practice:PracticeBoss|null) {
  const current = mobileViewport();
  if (current.blocked) return;
  if (current.touch && inputDevice.value !== 'gamepad' && shell.value) fullscreen.enter(shell.value);
  if(practice)character.value = definition.value.defaultHero;
  if(practice)biome.value=definition.value.defaultMap;
  storageFailed.value=false;
  screen.value = 'game';
  commands.emit({ type: practice?'boss-practice':'restart', practiceBoss:practice??undefined, character: character.value, biome: biome.value });
}
function updateSettings(value: Settings) { settings.value = value; profile.value.settings = value; void platform.saveSettings(value).catch(platformError); commands.emit({ type: 'settings', value }); }
function openSettings() { commands.emit({ type: 'pause' }); screen.value = 'settings'; }
function key(event: KeyboardEvent) {
  if (screen.value !== 'game' || event.repeat || !shell.value?.contains(event.target as Node)) return;
  if (event.key === 'Escape' || event.key.toLowerCase() === 'p') { event.preventDefault(); if (state.value?.status === 'playing') commands.emit({ type: 'pause' }); else if (state.value?.status === 'paused') commands.emit({ type: 'resume' }); }
}
let resizeObserver: ResizeObserver | undefined;
onMounted(() => {
  offUpgradeSpace = installUpgradeSpaceGuard(shell.value!, () => state.value?.status === 'upgrade' || state.value?.status === 'over');
  window.addEventListener('keydown', key);
  void (async () => {
    try {
      const [module, config, saved] = await Promise.all([import('./game/bootstrap/createGame'), props.definition ? Promise.resolve(props.definition) : platform.getGameConfiguration(), platform.loadProfile()]);
      if (disposed || !mount.value) return;
      assertGameDefinition(config); definition.value = config; character.value = config.defaultHero; biome.value = config.defaultMap;
      profile.value = saved; settings.value = saved.settings;
      game = module.createGame(mount.value, settings.value, { definition: config, bridge, visualMode: props.visualMode ?? config.visualMode, assetBaseUrl: (props.assetBaseUrl ?? import.meta.env.BASE_URL).replace(/\/?$/, '/'), developmentTools: props.developmentTools, inputTarget: shell.value });
      resizeObserver = new ResizeObserver(() => { if (mount.value && game?.isBooted) game.scale.setParentSize(mount.value.clientWidth, mount.value.clientHeight); });
      resizeObserver.observe(mount.value); emit('ready');
    } catch (error) { if (!disposed) { loadError.value = error instanceof Error ? error.message : String(error); emit('platform-error', error); } }
  })();
});
defineExpose({ bridge, getGame: () => game });
onMounted(() => { window.addEventListener('resize', resizeViewport); document.addEventListener('fullscreenchange', resizeViewport); window.screen.orientation?.addEventListener('change', resizeViewport); window.visualViewport?.addEventListener('resize', resizeViewport); });
onUnmounted(() => { fullscreen.destroy(); window.removeEventListener('resize', resizeViewport); document.removeEventListener('fullscreenchange', resizeViewport); window.screen.orientation?.removeEventListener('change', resizeViewport); window.visualViewport?.removeEventListener('resize', resizeViewport); });
onUnmounted(() => { disposed = true; resizeObserver?.disconnect(); off(); offMetrics(); offDevice(); offNotice(); offPadUi(); clearTimeout(noticeTimer); offUpgradeSpace?.(); window.removeEventListener('keydown', key); game?.destroy(true); game = undefined; bridge.dispose(); });
</script>
<template>
 <main ref="shell" class="game-base" tabindex="0" :class="{ 'touch-layout': viewport.touch }">
  <div v-if="viewport.blocked" class="rotate-device" role="dialog" aria-modal="true" aria-label="Поверните устройство горизонтально">↻<h1>Поверните устройство горизонтально</h1></div>
  <div :inert="viewport.blocked || undefined">
  <div ref="mount" class="game-mount"></div><p v-if="loadError" class="loading-error" role="alert">{{ loadError }}</p><div class="vignette"></div>
  <div v-if="controllerNotice" class="controller-notice" role="status">{{ controllerNotice }}</div>
  <div v-if="debug && debugState" class="debug-hud">FPS {{ debugState.fps.toFixed(1) }} · update {{ debugState.updateMs.toFixed(2) }}ms<br>mobs {{ debugState.enemies }} / bullets {{ debugState.projectiles }} / XP {{ debugState.orbs }} / bosses {{ debugState.bosses }}<br>chunks {{ debugState.chunks }} / sprites {{ debugState.sprites }} + {{ debugState.pooledSprites }} pooled</div>
  <MainMenu v-if="state?.status === 'menu'" :best="profile.records[0]?.score ?? 0" :character="character" :biome="biome" :definition="definition" @character="chooseCharacter" @biome="chooseBiome" @play="start" @boss-practice="startBossPractice" @guardian-practice="startGuardianPractice" @help="screen = 'help'" @settings="openSettings" @records="screen = 'records'" />
  <template v-if="state && state.status !== 'menu'">
   <UltimateControl :state="state" @activate="commands.emit({ type: 'ultimate' })" />
   <GameHUD :state="state" :icons="themeIcons" @pause="commands.emit({ type: 'pause' })" /><BossBars v-if="state.finalEncounter.phase==='inactive'" :bosses="state.bosses" /><FinalBossBar v-else :state="state" />
   <VirtualJoystick v-if="state.status === 'playing' || state.status === 'upgrade'" @move="commands.emit({ type: 'move', input: $event })" />
   <LevelUpModal v-if="state.status === 'upgrade'" :choices="state.choices" :level="state.level - state.pending + 1" :offer="state.offerId" @choose="(id, offer) => commands.emit({ type: 'upgrade', id, offer })" />
   <DialogFrame v-if="state.status === 'paused' && screen === 'game'" label="Пауза" @close="commands.emit({ type: 'resume' })"><small>ЧАЩА ПОДОЖДЁТ</small><h1>Пауза</h1><p>Переведи дух. Твоя магия никуда не исчезнет.</p><div class="button-stack"><button v-pad="() => commands.emit({ type: 'resume' })" @click="commands.emit({ type: 'resume' })">Продолжить →</button><button class="secondary" v-pad="openSettings" @click="openSettings">Настройки</button><button class="text-button" v-pad="() => commands.emit({ type: 'menu' })" @click="commands.emit({ type: 'menu' })">В главное меню</button></div></DialogFrame>
   <DialogFrame v-if="state.status === 'over' && resultsVisible" label="Игра окончена"><p v-if="state.practice" class="muted">Тренировка · результат не записывается в рекорды.</p><small>{{state.outcome==='victory'?victoryTitle(state.practiceBoss):'ПОСЛЕДНЯЯ ИСКРА'}}</small><h1 v-if="state.outcome==='victory'">Победа!</h1><h1 v-else>Чаща сильнее.<br>Пока.</h1><button v-if="state.outcome==='victory'" class="victory-restart" v-pad="restartCurrent" @click="restartCurrent">Начать заново</button><p>Время {{ formatTime(state.practiceElapsed??state.elapsed) }} · Уровень {{ state.level }} · Убийства {{ state.kills }}</p><h2 class="result-score">{{ state.score.toLocaleString('ru-RU') }} <small>ОЧКОВ</small></h2><p v-if="!state.practice" class="previous-best">Предыдущий рекорд: {{ previousBest }} <b v-if="state.score > previousBest">· Новый рекорд!</b></p><div class="run-build"><span v-for="ability in state.abilities.filter(a => a.level > 0)" :key="ability.id">{{ ability.icon }} {{ ability.name }} {{ ability.level }}</span></div><p class="muted">Ростки {{ state.killsByKind.grunt }} · Бегуны {{ state.killsByKind.runner }} · Големы {{ state.killsByKind.tank }} · Стрелки {{ state.killsByKind.caster }} · Боссы {{ state.bossKills }}</p><RunStatistics :state="state" /><LocalRecords v-if="!state.practice" :records="profile.records.slice(0, 3)" /><p v-if="storageFailed" class="muted">Хранилище браузера недоступно. Результат доступен до закрытия вкладки.</p><div class="button-stack"><button v-if="state.outcome!=='victory'" v-pad="restartCurrent" @click="restartCurrent">Начать заново</button><button class="text-button" v-pad="() => commands.emit({ type: 'menu' })" @click="commands.emit({ type: 'menu' })">В главное меню</button></div></DialogFrame>
  </template>
  <SettingsPanel v-if="screen === 'settings'" :settings="settings" @change="updateSettings" @close="screen = 'game'" />
  <DialogFrame v-if="screen === 'records'" label="Локальные рекорды" @close="screen = 'game'"><small>ТВОЯ ИСТОРИЯ В ЭТОЙ ЧАЩЕ</small><h1>Личные рекорды</h1><LocalRecords :records="profile.records" /><p class="muted">Забегов: {{ profile.statistics.runs }} · Убийств: {{ profile.statistics.kills }}. Данные хранятся локально в этом браузере.</p><button v-pad="() => screen = 'game'" @click="screen = 'game'">Назад</button></DialogFrame>
  <DialogFrame v-if="screen === 'help'" label="Как играть" @close="screen = 'game'">
   <small>ПЕРЕД ПЕРВОЙ ИСКРОЙ</small><h1>Как играть</h1>
   <p class="help-intro">{{ definition.description }}</p>
   <ol class="how-to mvp-help">
    <li><b>Двигайся.</b> WASD, стрелки, сенсорный джойстик или левый стик. Магия целится и атакует сама.</li>
    <li><b>Собирай XP.</b> Уровень ставит мир на паузу. Выбор: 1/2/3 или Tab/Enter; геймпад — D-Pad ←/→ / LB/RB и A (Cross). Space не выбирает карту.</li>
    <li><b>Используй Blink.</b> Space или X (Square). Esc / P / Start (Options) — пауза. B (Circle) не назначена.</li>
    <li><b>Guardian активен сразу.</b> Первый — на 4:00, неподвижен, отмечен звездой. Уклоняйся от медленных и быстрых самонаводящихся сфер. За полную волну — один артефакт; уход из зоны прерывает награду.</li>
    <li><b>Следи за планом.</b> Enrage — с 10:00, события каждые 30с. С 15:00 — Phase II и запрос трёх боссов за окно. Лимит: 3 босса и 3 Guardian; занятые слоты пропускаются.</li>
    <li><b>20:00 — финальный Страж.</b> Победа приходит после его смерти. Уклоняйся от рывка и сектора меча; на 70% HP разрушь три опоры щита, на 30% следи за двумя группами небесных метеоритов. Лучи щита безопасны, ритуальные Guardian не выдают артефактов.</li>
   </ol>
   <p class="help-footer">Продержись до 20:00 и победи финального Стража. Рекорды хранятся только в этом браузере.</p>
   <button v-pad="() => screen = 'game'" @click="screen = 'game'">Понятно</button>
  </DialogFrame>
  </div>
 </main>
</template>

<style src="./style.css"></style>
<style src="./ui/hd-theme.css"></style>
<style src="./ui/mobile-layout.css"></style>
<style scoped>
.mvp-help{font-size:12px;line-height:1.5;margin:12px 0;padding-left:20px}.mvp-help li{margin:9px 0}.help-intro,.help-footer{font-size:12px!important;line-height:1.5!important;margin:10px 0}
</style>
