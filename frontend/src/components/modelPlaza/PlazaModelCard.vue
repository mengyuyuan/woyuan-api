<template>
  <article class="wy-model-card" :aria-label="model.name">
    <div class="wy-model-card-top">
      <div class="wy-model-provider"><PlatformIcon :platform="model.platform" size="md" /><span>{{ platformLabel(model.platform) }}</span></div>
      <button class="wy-model-copy" :aria-label="t('modelPlaza.cards.copyName', { name: model.name })" :title="t('modelPlaza.cards.copy')" @click="copyToClipboard(model.name)"><Icon :name="copied ? 'check' : 'copy'" size="sm" /></button>
    </div>
    <div class="wy-model-card-title">
      <h3 :title="model.name">{{ model.name }}</h3>
      <p>{{ group.name }}</p>
    </div>
    <div class="wy-model-card-pricing">
      <p class="wy-model-price-caption">{{ t('modelPlaza.cards.standardPrice') }}<span v-if="priceTier"> · {{ tierLabel(priceTier) }}</span></p>
      <dl v-if="isToken" class="wy-model-price-pair">
        <div><dt>{{ t('modelPlaza.table.input') }}</dt><dd>{{ paidPerMillion(firstTier ? firstTier.input_price : model.pricing?.input_price) }}</dd></div>
        <div><dt>{{ t('modelPlaza.table.output') }}</dt><dd>{{ paidPerMillion(firstTier ? firstTier.output_price : model.pricing?.output_price) }}</dd></div>
      </dl>
      <dl v-else class="wy-model-price-pair"><div><dt>{{ billingModeLabel(model) }}</dt><dd>{{ paidRequestPrice(model, requestTier ? requestTier.per_request_price : model.pricing?.per_request_price) }}<small>{{ perUnitSuffix(model) }}</small></dd></div></dl>
      <p class="wy-model-price-unit">{{ isToken ? t('modelPlaza.cards.perMillion') : t('modelPlaza.cards.requestPricing') }}<span>{{ cardRate }}×</span></p>
    </div>
    <footer class="wy-model-card-footer">
      <span class="wy-model-type">{{ isToken ? 'TOKEN' : billingModeLabel(model) }}<span v-if="hasTiers" class="wy-model-tier-dot" :title="t('modelPlaza.cards.tiered')"></span></span>
      <button :aria-label="t('modelPlaza.cards.detailsFor', { name: model.name })" @click="emit('details', model)">{{ t('modelPlaza.cards.details') }}<Icon name="arrowRight" size="sm" /></button>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ModelPlazaGroup, PlazaModel } from '@/api/modelPlaza'
import { BILLING_MODE_TOKEN } from '@/constants/channel'
import { usePlazaPricing } from '@/composables/usePlazaPricing'
import { useClipboard } from '@/composables/useClipboard'
import { platformLabel } from '@/utils/platformColors'
import PlatformIcon from '@/components/common/PlatformIcon.vue'
import Icon from '@/components/icons/Icon.vue'

const props = defineProps<{ model: PlazaModel; group: ModelPlazaGroup }>()
const emit = defineEmits<{ details: [model: PlazaModel] }>()
const { t } = useI18n()
const { copied, copyToClipboard } = useClipboard()
const pricingOptions = computed(() => ({
  models: [props.model], rateMultiplier: props.group.rate_multiplier,
  userRateMultiplier: props.group.user_rate_multiplier,
  imageRateIndependent: props.group.image_rate_independent, imageRateMultiplier: props.group.image_rate_multiplier,
  videoRateIndependent: props.group.video_rate_independent, videoRateMultiplier: props.group.video_rate_multiplier
}))
// Getters retain reactivity when user-specific rates or the catalogue refresh.
const pricing = usePlazaPricing({
  get models() { return pricingOptions.value.models },
  get rateMultiplier() { return pricingOptions.value.rateMultiplier },
  get userRateMultiplier() { return pricingOptions.value.userRateMultiplier },
  get imageRateIndependent() { return pricingOptions.value.imageRateIndependent },
  get imageRateMultiplier() { return pricingOptions.value.imageRateMultiplier },
  get videoRateIndependent() { return pricingOptions.value.videoRateIndependent },
  get videoRateMultiplier() { return pricingOptions.value.videoRateMultiplier }
})
const { billingMode, billingModeLabel, paidPerMillion, paidRequestPrice, perUnitSuffix, tierLabel } = pricing
const isToken = computed(() => billingMode(props.model) === BILLING_MODE_TOKEN)
const firstTier = computed(() => isToken.value ? pricing.tokenIntervals(props.model)[0] : undefined)
const requestTier = computed(() => [...pricing.requestIntervals(props.model)].sort((a, b) => a.min_tokens - b.min_tokens)[0])
const priceTier = computed(() => isToken.value ? firstTier.value : requestTier.value)
const hasTiers = computed(() => (isToken.value ? pricing.tokenIntervals(props.model) : pricing.requestIntervals(props.model)).length > 1)
const cardRate = computed(() => isToken.value ? pricing.effectiveRate.value : pricing.requestRate(props.model))
</script>
