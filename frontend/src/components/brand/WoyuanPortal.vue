<template>
  <div ref="stage" class="wy-portal-art wy-portal-stage" :class="{ 'wy-gpu-ready': ready, 'wy-portal-still': paused }">
    <div class="wy-art-label" aria-hidden="true">WOYUAN / 001 <span>IMAGINATION IN MOTION</span></div>
    <div class="wy-orbital-field" aria-hidden="true">
      <svg viewBox="0 0 500 500" fill="none"><ellipse cx="250" cy="250" rx="225" ry="98" transform="rotate(-32 250 250)" stroke="#b9bdc7" stroke-width=".6"/><ellipse class="wy-orbit-trace" cx="250" cy="250" rx="225" ry="98" transform="rotate(-32 250 250)" stroke="#2354f4" stroke-width="1.8" stroke-dasharray="8 1100"/><circle cx="250" cy="250" r="203" stroke="#dfe2e8" stroke-width=".5" stroke-dasharray="1 9"/></svg>
    </div>
    <canvas ref="canvas" class="wy-portal-canvas" aria-hidden="true"></canvas>
    <div class="wy-portal-emblem" aria-hidden="true"><img :src="logo || '/brand/logo.png'" alt="" /></div>
    <span class="wy-portal-axis" aria-hidden="true">001 — EVERY IDEA IS A BEGINNING</span>
    <div class="wy-portal-bottom">
      <span class="wy-portal-caption"><i :class="{ 'is-still': paused }"></i>{{ en ? 'MOVE YOUR CURSOR. MAKE A LITTLE SPACE.' : '移动光标，拨动灵感。' }}</span>
      <button type="button" class="wy-motion-toggle" :aria-label="paused ? (en ? 'Play animation' : '开启动效') : (en ? 'Pause animation' : '暂停动效')" :aria-pressed="!paused" @click="toggle">
        <svg v-if="!paused" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M3 2h2v8H3zm4 0h2v8H7z" /></svg>
        <svg v-else viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="m4 2 6 4-6 4z" /></svg>
        {{ paused ? (en ? 'Play' : '开启') : (en ? 'Pause' : '暂停') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePortalScene } from '@/composables/usePortalScene'

defineProps<{ logo: string; en: boolean }>()
const stage = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const { ready, paused, toggle } = usePortalScene(stage, canvas)
</script>

<style scoped>
.wy-portal-stage{height:530px!important;transform:none!important;min-width:0;position:relative}
.wy-art-label{font:9px ui-monospace!important;letter-spacing:1.5px!important;color:#747982!important}
.wy-portal-canvas{position:absolute;inset:8% -8%;width:116%;height:84%;opacity:0;transition:opacity .6s;touch-action:pan-y}
.wy-gpu-ready .wy-portal-canvas{opacity:1}.wy-gpu-ready .wy-portal-emblem{opacity:0}
.wy-orbital-field{position:absolute;inset:7% -7%;pointer-events:none;transform:rotate(-5deg);animation:wy-orbit-drift 20s ease-in-out infinite}.wy-orbital-field svg{width:100%;height:100%;overflow:visible}.wy-orbit-trace{animation:wy-trace 12s linear infinite}
.wy-portal-emblem{position:absolute;inset:17% 20%;transition:opacity .7s;pointer-events:none}.wy-portal-emblem img{width:100%;height:100%;object-fit:contain}
.wy-portal-axis{position:absolute;left:2%;top:40%;writing-mode:vertical-rl;transform:rotate(180deg);color:#9a9da6;font:8px ui-monospace;letter-spacing:1.3px;pointer-events:none}
.wy-portal-bottom{position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;gap:12px;color:#686d77;font:10px ui-monospace;letter-spacing:.7px}
.wy-portal-caption{display:flex;align-items:center;gap:10px}.wy-portal-caption i{width:4px;height:4px;background:#2354f4;border-radius:50%}.wy-portal-caption i.is-still{background:#999}
.wy-motion-toggle{display:flex;align-items:center;gap:7px;padding:10px 8px;font-size:10px;letter-spacing:.5px;z-index:1;transition:color .2s}.wy-motion-toggle:hover{color:#2354f4}.wy-motion-toggle svg{width:10px;height:10px}
.wy-portal-still .wy-orbital-field,.wy-portal-still .wy-orbit-trace{animation-play-state:paused}
@keyframes wy-trace{to{stroke-dashoffset:-1108}}
@keyframes wy-orbit-drift{50%{transform:rotate(8deg)}}
@media(max-width:1000px){.wy-portal-stage{height:470px!important}.wy-art-label{font-size:8px!important}.wy-portal-bottom{font-size:9px;letter-spacing:0}}
@media(max-width:760px){.wy-portal-stage{height:450px!important;width:100%;max-width:500px;margin:30px 0 0}.wy-portal-canvas{inset:5% -5%;width:110%;height:90%}.wy-orbital-field{inset:10% -2%}.wy-portal-axis{font-size:7px}.wy-portal-bottom{font-size:9px}}
@media(max-width:380px){.wy-portal-stage{height:400px!important;width:100%!important;margin-bottom:0}}
@media(prefers-reduced-motion:reduce){.wy-orbital-field,.wy-orbit-trace{animation:none}}
</style>
