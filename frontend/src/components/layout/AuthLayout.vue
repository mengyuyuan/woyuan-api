<template>
  <div class="wy-auth">
    <header class="wy-auth-header">
      <router-link to="/home" class="wy-auth-brand"><img :src="siteLogo || '/brand/logo.png'" alt="我愿api" /><span>{{ siteName }}<small>MAKE WHAT YOU IMAGINE.</small></span></router-link>
      <div><LocaleSwitcher /><router-link to="/home" class="wy-auth-back">{{ en ? 'Back to home' : '返回首页' }} ↗</router-link></div>
    </header>
    <main class="wy-auth-main">
      <section class="wy-auth-story">
        <p class="wy-auth-eyebrow">SHI YU WO YUAN / THE POSSIBILITY PORTAL</p>
        <h1>{{ en ? 'Every world\nstarts with\nan idea.' : '万千世界，\n始于一个\n想法。' }}</h1>
        <p class="wy-auth-description">{{ en ? 'Connect to intelligence.\nGive your next idea a place to begin.' : '连接智能，让创造发生。\n你的下一个想法，从这里开始。' }}</p>
        <div class="wy-auth-emblem" aria-hidden="true"><span></span><img :src="siteLogo || '/brand/logo.png'" alt="" /></div>
        <p class="wy-auth-caption"><span></span> {{ en ? 'A WORLD IN THE MAKING.' : '练习造世界。每一步，都算数。' }}</p>
      </section>
      <section class="wy-auth-form-panel">
        <div class="wy-auth-form"><p class="wy-auth-eyebrow">WOYUAN / YOUR WORKSPACE</p><slot /><div class="wy-auth-form-footer"><slot name="footer" /></div></div>
      </section>
    </main>
    <footer class="wy-auth-footer"><span>© {{ currentYear }} {{ siteName }} / 世于我愿</span><span>IMAGINATION → REALITY</span></footer>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores'
import { sanitizeUrl } from '@/utils/url'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
const appStore = useAppStore()
const { locale } = useI18n()
const en = computed(() => locale.value === 'en')
const siteName = computed(() => appStore.siteName || '我愿api')
const siteLogo = computed(() => sanitizeUrl(appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))
const currentYear = new Date().getFullYear()
onMounted(() => { appStore.fetchPublicSettings() })
</script>
<style scoped>
.wy-auth{--paper:#f9fafc;--ink:#121620;--muted:#747d8f;--line:#e1e5ed;min-height:100vh;background:var(--paper);color:var(--ink);display:flex;flex-direction:column}.wy-auth-header{padding:24px 5%;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);gap:20px}.wy-auth-header>div{display:flex;align-items:center;gap:28px}.wy-auth-brand{display:flex;align-items:center;gap:12px}.wy-auth-brand img{width:34px;height:43px;object-fit:contain}.wy-auth-brand>span{font-size:23px;font-weight:700;letter-spacing:-1px;line-height:1}.wy-auth-brand small{display:block;font:7px ui-monospace;letter-spacing:1px;margin-top:8px;color:var(--muted)}.wy-auth-back{font-size:11px;color:var(--muted)}.wy-auth-main{display:grid;grid-template-columns:1fr 1fr;flex:1;max-width:1440px;width:100%;margin:auto}.wy-auth-story{position:relative;overflow:hidden;padding:60px 10%;border-right:1px solid var(--line);min-height:660px;isolation:isolate}.wy-auth-eyebrow{font:8px/1.6 ui-monospace;letter-spacing:1.7px;color:var(--muted)}.wy-auth-story h1{font-size:clamp(46px,5vw,76px);line-height:1.2;font-weight:600;letter-spacing:-4px;white-space:pre-line;margin-top:40px}.wy-auth-story h1::first-line{color:#2354f4}.wy-auth-description{margin-top:25px;font-size:12px;line-height:1.9;white-space:pre-line;color:var(--muted)}.wy-auth-emblem{position:absolute;right:-40px;bottom:35px;width:230px;height:340px;z-index:-1}.wy-auth-emblem img{width:130px;height:200px;object-fit:contain;position:absolute;top:80px;left:50px;opacity:.09}.wy-auth-emblem>span{display:block;width:230px;height:320px;border:1px solid #9cb5ff;border-radius:180px 180px 0 0;transform:rotate(-15deg)}.wy-auth-caption{position:absolute;bottom:38px;left:10%;font-size:9px;color:var(--muted);letter-spacing:1px;display:flex;gap:8px;align-items:center}.wy-auth-caption>span{width:5px;height:5px;border-radius:50%;background:#2354f4}.wy-auth-form-panel{display:flex;align-items:center;justify-content:center;padding:50px 10%}.wy-auth-form{width:100%;max-width:360px}.wy-auth-form>.wy-auth-eyebrow{margin-bottom:28px;color:#2354f4}.wy-auth-form-footer{text-align:center;margin-top:25px;font-size:12px}.wy-auth-form :deep(.text-center){text-align:left}.wy-auth-form :deep(h2){font-size:29px;letter-spacing:-1px;font-weight:600}.wy-auth-form :deep(.input){border-radius:7px;min-height:46px;background:white}.wy-auth-form :deep(.btn){border-radius:7px;min-height:44px;box-shadow:none}.wy-auth-form :deep(.btn-primary){background:#2354f4}.wy-auth-footer{padding:22px 5%;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:20px;font:8px ui-monospace;letter-spacing:1px;color:var(--muted)}
:global(.dark) .wy-auth{--paper:#11151f;--ink:#f3f5fa;--muted:#929bad;--line:#293142}:global(.dark) .wy-auth-form :deep(.input){background:#1c2331}
@media(max-width:900px){.wy-auth-story{padding-top:48px}.wy-auth-story h1{font-size:55px}.wy-auth-main{grid-template-columns:.9fr 1fr}.wy-auth-form-panel{padding:45px 8%}.wy-auth-emblem{right:-100px;opacity:.7}}
@media(max-width:640px){.wy-auth-header{padding:18px 6%}.wy-auth-brand>span{font-size:21px}.wy-auth-brand img{width:29px;height:37px}.wy-auth-brand small{font-size:6px}.wy-auth-header>div{gap:10px}.wy-auth-back{font-size:10px}.wy-auth-main{display:block}.wy-auth-story{display:none}.wy-auth-form-panel{padding:48px 7%;min-height:calc(100vh - 153px)}.wy-auth-form{max-width:380px}.wy-auth-footer{padding:20px 6%;font-size:7px;letter-spacing:.5px}}
</style>
