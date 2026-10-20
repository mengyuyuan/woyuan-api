<template>
  <div ref="stage" class="wy-portal-art wy-portal-stage" :class="{ 'wy-gpu-ready': ready, 'wy-portal-still': paused }">
    <div class="wy-art-label" aria-hidden="true">FIG. 01 <span>THE POSSIBILITY PORTAL</span></div>
    <div class="wy-portal-atmosphere" aria-hidden="true"></div>
    <div class="wy-portal-fallback" aria-hidden="true"><i></i><i></i><i></i></div>
    <canvas ref="canvas" class="wy-portal-canvas" aria-hidden="true"></canvas>
    <div class="wy-portal-emblem" aria-hidden="true"><img :src="logo || '/brand/logo.png'" alt="" /></div>
    <span class="wy-portal-axis" aria-hidden="true">IMAGINATION → REALITY</span>
    <div class="wy-portal-bottom">
      <span class="wy-portal-caption"><i :class="{ 'is-still': paused }"></i>{{ en ? 'A WORLD IN THE MAKING' : '下一种可能，由你开启' }}</span>
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
.wy-portal-stage{height:540px!important;transform:none!important;min-width:0}
.wy-portal-atmosphere{position:absolute;inset:4% -12% 2%;background:radial-gradient(ellipse at 52% 49%,#ccdcff7a,transparent 58%);pointer-events:none}
.wy-portal-atmosphere::after{content:"";position:absolute;left:22%;right:13%;bottom:15%;height:9%;background:#4470df1c;border-radius:50%;filter:blur(20px);transform:rotate(-8deg)}
.wy-portal-canvas{position:absolute;inset:13px -12% 20px;width:124%;height:calc(100% - 33px);opacity:0;transition:opacity 1.2s;mask-image:linear-gradient(transparent,#000 7%,#000 85%,transparent 99%);touch-action:pan-y}
.wy-gpu-ready .wy-portal-canvas{opacity:1}.wy-gpu-ready .wy-portal-fallback{opacity:0}
.wy-portal-emblem{position:absolute;left:50%;top:43%;width:90px;height:128px;transform:translate(-50%,-50%) translate(var(--emblem-x,0px),var(--emblem-y,0px));pointer-events:none;filter:drop-shadow(0 18px 16px #2354f419);transition:transform 1s cubic-bezier(.16,1,.3,1)}
.wy-portal-emblem img{width:100%;height:100%;object-fit:contain;animation:wy-emblem-hover 8s ease-in-out infinite}
.wy-portal-axis{position:absolute;left:3%;top:40%;writing-mode:vertical-rl;transform:rotate(180deg);color:#8d9bb7;font:8px ui-monospace;letter-spacing:1.5px;pointer-events:none}
.wy-portal-bottom{position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;gap:12px;color:#748099;font:8px ui-monospace;letter-spacing:1.2px}
.wy-portal-caption{display:flex;align-items:center;gap:8px}.wy-portal-caption i{width:5px;height:5px;background:#2354f4;border-radius:50%;box-shadow:0 0 0 4px #2354f40a;animation:wy-portal-beacon 3s ease-in-out infinite}.wy-portal-caption i.is-still{animation:none;background:#8d9bb7;box-shadow:none}
.wy-motion-toggle{display:flex;align-items:center;gap:7px;padding:10px 8px;font-size:9px;letter-spacing:.5px;z-index:1;transition:color .2s}.wy-motion-toggle:hover{color:#2354f4}.wy-motion-toggle svg{width:10px;height:10px}
.wy-portal-fallback{position:absolute;inset:15% 18% 21%;transition:opacity 1s}.wy-portal-fallback i{position:absolute;inset:0;border:1px solid #6489ef;border-bottom:0;border-radius:150px 150px 0 0}.wy-portal-fallback i:nth-child(2){inset:10% 12% 0;border-color:#9bb2ee}.wy-portal-fallback i:nth-child(3){inset:20% 24% 0;border-color:#c0cfee}
.wy-portal-still .wy-portal-emblem img{animation-play-state:paused}
@keyframes wy-emblem-hover{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-12px) rotate(2deg)}}
@keyframes wy-portal-beacon{50%{box-shadow:0 0 0 6px #2354f400;opacity:.5}}
@media(max-width:1000px){.wy-portal-stage{height:500px!important}.wy-portal-emblem{width:78px;height:112px}.wy-portal-bottom{font-size:7px;letter-spacing:.4px}.wy-art-label{font-size:7px;letter-spacing:.5px}}
@media(max-width:760px){.wy-portal-stage{height:510px!important;margin-top:15px;margin-bottom:0;max-width:500px}.wy-portal-canvas{inset:13px -5% 20px;width:110%}.wy-portal-emblem{width:90px;height:128px}.wy-portal-bottom{font-size:8px}.wy-art-label{font-size:8px}}
@media(max-width:380px){.wy-portal-stage{width:100%!important;height:440px!important;margin-bottom:0}.wy-portal-emblem{width:74px;height:108px}}
@media(prefers-reduced-motion:reduce){.wy-portal-emblem img,.wy-portal-caption i{animation:none}.wy-portal-emblem{transform:translate(-50%,-50%)}.wy-portal-canvas{transition:none}}
</style>
