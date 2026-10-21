import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PlazaModelCard from '../PlazaModelCard.vue'
import type { ModelPlazaGroup, PlazaModel } from '@/api/modelPlaza'

const { copy } = vi.hoisted(() => ({ copy: vi.fn() }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/composables/useClipboard', () => ({ useClipboard: () => ({ copied: false, copyToClipboard: copy }) }))

const model: PlazaModel = {
  name: 'test-model', platform: 'openai', official_pricing: null,
  pricing: { billing_mode: 'token', input_price: 0.00001, output_price: 0.00002, cache_write_price: null, cache_read_price: null, image_input_price: null, image_output_price: null, per_request_price: null, intervals: [] }
}
const group: ModelPlazaGroup = {
  id: 1, name: 'test-group', platform: 'openai', description: '', subscription_type: 'standard',
  rate_multiplier: 2, peak_rate_enabled: false, peak_start: '', peak_end: '', peak_rate_multiplier: 1,
  is_exclusive: false, image_rate_independent: false, image_rate_multiplier: 1,
  video_rate_independent: false, video_rate_multiplier: 1, long_context_pricing_enabled: true, models: [model]
}
function card(m = model, g = group) {
  return mount(PlazaModelCard, { props: { model: m, group: g }, global: { stubs: { PlatformIcon: true, Icon: true } } })
}

describe('model card pricing and actions', () => {
  it('displays the same paid input and output units as the detailed table', () => {
    const wrapper = card()
    expect(wrapper.findAll('dd').map(e => e.text())).toEqual(['$20.00', '$40.00'])
  })
  it('updates when a user-specific zero rate is applied', async () => {
    const wrapper = card()
    await wrapper.setProps({ group: { ...group, user_rate_multiplier: 0 } })
    expect(wrapper.findAll('dd').map(e => e.text())).toEqual(['$0.00', '$0.00'])
    expect(wrapper.find('.wy-model-price-unit').text()).toContain('0×')
  })
  it('resolves the first context tier in context order instead of showing a misleading base price', () => {
    const tier = { min_tokens: 0, max_tokens: 100000, tier_label: '', input_price: null, output_price: null, cache_write_price: null, cache_read_price: null, per_request_price: null }
    const wrapper = card({ ...model, pricing: { ...model.pricing!, intervals: [{ ...tier, min_tokens: 100000, max_tokens: null, input_multiplier: 4 }, { ...tier, input_multiplier: 1.5, output_multiplier: 2 }] } })
    expect(wrapper.findAll('dd').map(e => e.text())).toEqual(['$30.00', '$80.00'])
    expect(wrapper.find('.wy-model-price-caption').text()).toContain('≤100K')
  })
  it('uses an independent zero video rate without multiplying by a million', () => {
    const wrapper = card({ ...model, pricing: { ...model.pricing!, billing_mode: 'video', per_request_price: 0.25 } }, { ...group, video_rate_independent: true, video_rate_multiplier: 0 })
    expect(wrapper.find('dd').text()).toContain('$0.00')
    expect(wrapper.find('.wy-model-price-unit').text()).toContain('0×')
  })
  it('keeps missing pricing distinct from a free model', () => {
    const wrapper = card({ ...model, pricing: null })
    expect(wrapper.findAll('dd').map(e => e.text())).toEqual(['-', '-'])
  })
  it('labels the displayed media tier rather than presenting it as a flat price', () => {
    const interval = { min_tokens: 0, max_tokens: null, tier_label: 'HD', input_price: null, output_price: null, cache_write_price: null, cache_read_price: null, per_request_price: 0.25 }
    const wrapper = card({ ...model, pricing: { ...model.pricing!, billing_mode: 'image', intervals: [interval] } })
    expect(wrapper.find('.wy-model-price-caption').text()).toContain('HD')
    expect(wrapper.find('dd').text()).toContain('$0.50')
  })
  it('copies the exact model name and opens details for that model', async () => {
    const wrapper = card()
    await wrapper.find('.wy-model-copy').trigger('click')
    expect(copy).toHaveBeenCalledWith('test-model')
    await wrapper.find('footer button').trigger('click')
    expect(wrapper.emitted('details')?.[0]).toEqual([model])
  })
})
