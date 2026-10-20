<template>
  <div ref="landingRoot" class="wy-landing">
    <div class="wy-scroll-progress" aria-hidden="true"></div>
    <header class="wy-nav">
      <router-link to="/home" class="wy-wordmark" aria-label="我愿api 首页">
        <img :src="siteLogo || '/brand/logo.png'" alt="我愿api" />
        <span>{{ siteName }}<small>MAKE WHAT YOU IMAGINE.</small></span>
      </router-link>
      <nav class="wy-nav-links" aria-label="主导航">
        <a href="#possibilities">{{ en ? 'Possibilities' : '探索可能' }}</a>
        <a href="#connect">{{ en ? 'Integration' : '接入指南' }}</a>
        <router-link v-if="showModelPlazaEntry" to="/model-plaza">{{ en ? 'Models' : '模型广场' }}</router-link>
      </nav>
      <div class="wy-nav-actions">
        <LocaleSwitcher />
        <router-link :to="destination" class="wy-small-button">{{ isAuthenticated ? (en ? 'Console' : '控制台') : (en ? 'Sign in' : '登录') }} <span aria-hidden="true">↗</span></router-link>
      </div>
    </header>

    <main>
      <section class="wy-hero">
        <div class="wy-hero-copy">
          <p class="wy-eyebrow"><span></span> {{ en ? 'A LITTLE INTELLIGENCE. A WORLD OF POSSIBILITY.' : '我愿api / 为想象接入智能' }}</p>
          <h1 v-if="!en"><span class="wy-heading-line"><span>让想象，</span></span><span class="wy-heading-line"><span><span class="wy-blue">自由发生。</span></span></span></h1>
          <h1 v-else><span class="wy-heading-line"><span>Imagine.</span></span><span class="wy-heading-line"><span class="wy-blue">Make it real.</span></span></h1>
          <p class="wy-hero-description">{{ en ? 'Connect intelligence to what comes next. One API for your applications, creative tools, and worlds yet to be built.' : '让智能成为创造的延伸。\n从一个想法出发，连接尚未诞生的世界。' }}</p>
          <div class="wy-hero-actions">
            <router-link :to="destination" class="wy-button">{{ en ? 'Start building' : '开始构建' }}<span aria-hidden="true">↗</span></router-link>
            <a href="#connect" class="wy-text-link">{{ en ? 'See how it works' : '看看如何接入' }}<span aria-hidden="true">↓</span></a>
          </div>
          <div class="wy-hero-note"><span class="wy-cross" aria-hidden="true">+</span>{{ en ? 'ONE CONNECTION. ENDLESS POSSIBILITIES.' : 'ONE API. YOUR NEXT POSSIBILITY.' }}</div>
        </div>
        <WoyuanPortal :logo="siteLogo" :en="en" />
      </section>

      <section class="wy-model-strip" aria-label="模型生态">
        <p>{{ en ? 'INTELLIGENCE, CONNECTED' : '连接多元智能' }}<span>{{ en ? 'Build with a familiar API' : '熟悉的接口，自由地创造' }}</span></p>
        <div class="wy-provider-names"><span>OpenAI</span><span class="wy-provider-claude">Claude</span><span>Gemini<span class="wy-gemini-star">✦</span></span><span class="wy-provider-grok">Grok</span></div>
      </section>

      <section id="possibilities" class="wy-possibilities">
        <div class="wy-section-heading" data-reveal><p class="wy-eyebrow">01 / {{ en ? 'POSSIBILITIES' : '把可能，变成作品' }}</p><h2>{{ en ? 'Your ambition.\nA place to begin.' : '愿景很远，\n下一步很近。' }}</h2><p>{{ en ? 'Less friction between an idea and its first working version.' : '把重复的接入工作留给我们，\n把时间留给你真正想创造的东西。' }}</p></div>
        <div class="wy-feature-grid">
          <article class="wy-feature" data-reveal><div class="wy-feature-top"><span>01</span><svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="m14 12-8 8 8 8m12-16 8 8-8 8m-4-21-4 26" stroke="currentColor" stroke-width="1.5" /></svg></div><h3>{{ en ? 'Build your first idea.' : '让第一个想法运行。' }}</h3><p>{{ en ? 'Connect your application with familiar API formats. Move from an experiment to something you can use.' : '通过兼容的 API 接口连接应用，让原型、工作流和创作工具真正运行起来。' }}</p><span class="wy-feature-tag">API / APPLICATIONS</span></article>
          <article class="wy-feature" data-reveal><div class="wy-feature-top"><span>02</span><svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><rect x="6" y="7" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="23" y="22" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M17 12h8a4 4 0 0 1 4 4v6M23 28h-8a4 4 0 0 1-4-4v-6" stroke="currentColor" stroke-width="1.5"/></svg></div><h3>{{ en ? 'Choose your intelligence.' : '为创造，选择智能。' }}</h3><p>{{ en ? 'Explore available models and use the capabilities that fit your task, from writing to code.' : '在模型广场查看已开放能力，为写作、编程与多模态任务选择合适的模型。' }}</p><span class="wy-feature-tag">MODELS / POSSIBILITIES</span></article>
          <article class="wy-feature" data-reveal><div class="wy-feature-top"><span>03</span><svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M7 32V21m9 11V13m9 19V7m9 25V17M5 35h31" stroke="currentColor" stroke-width="1.5"/></svg></div><h3>{{ en ? 'Keep the details in sight.' : '每一次调用，都清楚。' }}</h3><p>{{ en ? 'Manage your keys, review usage, and track your balance from one focused workspace.' : '密钥、用量、余额与调用记录，在一个工作台里清晰掌握。专注创造，也掌握成本。' }}</p><span class="wy-feature-tag">KEYS / USAGE / CONTROL</span></article>
        </div>
      </section>

      <section id="connect" class="wy-connect">
        <div class="wy-connect-copy" data-reveal><p class="wy-eyebrow">02 / {{ en ? 'FIRST CONTACT' : '从这里接入' }}</p><h2>{{ en ? 'A few lines.\nA new beginning.' : '几行代码，\n新的开始。' }}</h2><p>{{ en ? 'Create a key in your console, choose an available model, and make your first request.' : '在控制台创建 API 密钥，选择已开放的模型，\n发出你的第一次请求。' }}</p><ol><li><span>01</span>{{ en ? 'Sign in and create an API key' : '登录控制台，创建 API 密钥' }}</li><li><span>02</span>{{ en ? 'Set your base URL and model' : '填写接口地址与模型名称' }}</li><li><span>03</span>{{ en ? 'Run it. Make something yours.' : '运行代码，开始你的创造' }}</li></ol><a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer" class="wy-text-link">{{ en ? 'Read the documentation' : '查看完整接入文档' }} ↗</a><router-link v-else :to="destination" class="wy-text-link">{{ en ? 'Open your console' : '前往控制台' }} ↗</router-link></div>
        <div class="wy-code-card" data-reveal><div class="wy-code-header"><span><i></i> first_connection.py</span><button type="button" @click="copyCode" :aria-label="en ? 'Copy example code' : '复制示例代码'">{{ copied ? (en ? 'Copied' : '已复制') : (en ? 'Copy' : '复制') }}<Icon :name="copied ? 'check' : 'copy'" size="sm" /></button></div><pre><code><span class="wy-code-purple">import</span> os
<span class="wy-code-purple">from</span> openai <span class="wy-code-purple">import</span> OpenAI

client = OpenAI(
    api_key=os.environ[<span class="wy-code-string">"WOYUAN_API_KEY"</span>],
    base_url=<span class="wy-code-string">"{{ baseUrl }}"</span>
)

response = client.chat.completions.create(
    model=<span class="wy-code-string">"your-model"</span>,
    messages=[{
        <span class="wy-code-string">"role"</span>: <span class="wy-code-string">"user"</span>,
        <span class="wy-code-string">"content"</span>: <span class="wy-code-string">"Let's build something."</span>
    }]
)

<span class="wy-code-purple">print</span>(response.choices[0].message.content)</code></pre><div class="wy-code-foot"><span>PYTHON / OPENAI SDK</span><span>{{ en ? 'Replace your-model with an available model' : '请将 your-model 替换为已开放的模型名称' }}</span></div><p v-if="copyError" class="wy-copy-error" role="status">{{ en ? 'Select and copy the code above.' : '请选中上方代码手动复制。' }}</p></div>
      </section>

      <section class="wy-manifesto" data-reveal><span class="wy-eyebrow">SHI YU WO YUAN / A WORLD IN THE MAKING</span><h2 class="wy-scroll-type" :aria-label="manifestoLines.join(' ')"><span v-for="(line, row) in manifestoLines" :key="row" class="wy-manifesto-line" aria-hidden="true"><span v-for="(letter, index) in line" :key="index" :style="{ '--char': (manifestoLines.slice(0, row).join('').length + index) / manifestoLength }">{{ letter === ' ' ? '\u00a0' : letter }}</span></span></h2><div><p>{{ en ? 'We are practicing building worlds. Every useful tool, every working idea, is another step.' : '我们在练习造世界。\n每一个有用的工具，每一个落地的想法，\n都是通往那个世界的一步。' }}</p><router-link :to="destination" class="wy-button">{{ en ? 'Make your next move' : '迈出你的下一步' }}<span aria-hidden="true">↗</span></router-link></div><img :src="siteLogo || '/brand/logo.png'" alt="" aria-hidden="true" /></section>
    </main>
    <footer class="wy-footer"><router-link to="/home" class="wy-footer-brand"><img :src="siteLogo || '/brand/logo.png'" alt="" />{{ siteName }}</router-link><span>© {{ new Date().getFullYear() }} 世于我愿 · MAKE WHAT YOU IMAGINE.</span><div><router-link v-if="showModelPlazaEntry" to="/model-plaza">{{ en ? 'Models' : '模型广场' }} ↗</router-link><a href="https://github.com/mengyuyuan/woyuan-api" target="_blank" rel="noopener noreferrer">{{ en ? 'Source & credits' : '开源与致谢' }} ↗</a></div></footer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import Icon from '@/components/icons/Icon.vue'
import WoyuanPortal from './WoyuanPortal.vue'
import { sanitizeUrl } from '@/utils/url'
import { useWoyuanMotion } from '@/composables/useWoyuanMotion'

const landingRoot = ref<HTMLElement | null>(null)
useWoyuanMotion(landingRoot)

const props = defineProps<{ siteName: string; siteLogo: string; dashboardPath: string; isAuthenticated: boolean; showModelPlazaEntry: boolean; docUrl: string }>()
const { locale } = useI18n()
const en = computed(() => locale.value === 'en')
const manifestoLines = computed(() => (en.value ? 'The world we imagine,\nbegins with what we make.' : '世界，\n始于我愿。').split('\n'))
const manifestoLength = computed(() => manifestoLines.value.join('').length)
const appStore = useAppStore()
const destination = computed(() => props.isAuthenticated ? props.dashboardPath : '/login')
const baseUrl = computed(() => {
  const configured = sanitizeUrl(appStore.apiBaseUrl || '')
  const base = (configured || window.location.origin).replace(/\/$/, '')
  return base.endsWith('/v1') ? base : `${base}/v1`
})
const copied = ref(false)
const copyError = ref(false)
const code = computed(() => `import os\nfrom openai import OpenAI\n\nclient = OpenAI(\n    api_key=os.environ["WOYUAN_API_KEY"],\n    base_url=${JSON.stringify(baseUrl.value)}\n)\n\nresponse = client.chat.completions.create(\n    model="your-model",\n    messages=[{"role": "user", "content": "Let's build something."}]\n)\n\nprint(response.choices[0].message.content)`)
async function copyCode() {
  try { await navigator.clipboard.writeText(code.value); copied.value = true; copyError.value = false }
  catch { copyError.value = true }
}
</script>

<style src="@/styles/woyuan-landing.css"></style>
<style src="@/styles/woyuan-editorial.css"></style>
