import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { usePortalScene } from '../usePortalScene'

const frames = new Map<number, FrameRequestCallback>()
let frameId = 0
let visibility: IntersectionObserverCallback
let reduced = false
let draw: ReturnType<typeof vi.fn>
let deleteBuffer: ReturnType<typeof vi.fn>
let deleteProgram: ReturnType<typeof vi.fn>

const Harness = defineComponent({
  setup() {
    const stage = ref<HTMLElement | null>(null), canvas = ref<HTMLCanvasElement | null>(null)
    const scene = usePortalScene(stage, canvas)
    return () => h('div', { ref: stage, 'data-ready': scene.ready.value }, [
      h('canvas', { ref: canvas }),
      h('button', { onClick: scene.toggle }, scene.paused.value ? 'play' : 'pause'),
    ])
  },
})

beforeEach(() => {
  reduced = false; frameId = 0; frames.clear()
  draw = vi.fn(); deleteBuffer = vi.fn(); deleteProgram = vi.fn()
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { frames.set(++frameId, callback); return frameId }))
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => frames.delete(id)))
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) { visibility = callback }
    observe() {} disconnect() {}
  })
  vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
    matches: query.includes('reduced-motion') && reduced,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }) as unknown as MediaQueryList)
  const noop = vi.fn()
  const gl = new Proxy({
    createBuffer: () => ({}), createShader: () => ({}), createProgram: () => ({}),
    getShaderParameter: () => true, getProgramParameter: () => true,
    getUniformLocation: () => ({}), getAttribLocation: () => 0,
    drawArrays: draw, deleteBuffer, deleteProgram,
  }, { get: (target, key) => key in target ? target[key as keyof typeof target] : /^[A-Z_]+$/.test(String(key)) ? 1 : noop })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(gl as unknown as WebGLRenderingContext)
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('portal accessibility and GPU lifetime', () => {
  it('renders a still scene for reduced motion and only animates after an explicit play', async () => {
    reduced = true
    const wrapper = mount(Harness)
    await nextTick()
    expect(draw).toHaveBeenCalled()
    expect(frames.size).toBe(0)
    expect(wrapper.get('button').text()).toBe('play')
    await wrapper.get('button').trigger('click')
    expect(frames.size).toBe(1)
    await wrapper.get('button').trigger('click')
    expect(frames.size).toBe(0)
    wrapper.unmount()
  })

  it('stops rendering outside the viewport, resumes once, and releases GPU resources on navigation', () => {
    const wrapper = mount(Harness)
    expect(frames.size).toBe(1)
    visibility([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver)
    expect(frames.size).toBe(0)
    visibility([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
    visibility([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
    expect(frames.size).toBe(1)
    wrapper.unmount()
    expect(frames.size).toBe(0)
    expect(deleteBuffer).toHaveBeenCalled()
    expect(deleteProgram).toHaveBeenCalledOnce()
  })

  it('keeps the fallback available and cancels rendering when the GPU context is lost', async () => {
    const wrapper = mount(Harness)
    await wrapper.get('canvas').trigger('webglcontextlost')
    expect(wrapper.attributes('data-ready')).toBe('false')
    expect(frames.size).toBe(0)
    await wrapper.get('canvas').trigger('webglcontextrestored')
    expect(wrapper.attributes('data-ready')).toBe('true')
    expect(frames.size).toBe(1)
    wrapper.unmount()
  })

  it('does not schedule frames when WebGL is unavailable', () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null)
    const wrapper = mount(Harness)
    expect(wrapper.attributes('data-ready')).toBe('false')
    expect(frames.size).toBe(0)
    wrapper.unmount()
  })
})
