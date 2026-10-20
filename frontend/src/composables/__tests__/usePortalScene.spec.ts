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
let pointerUniform: ReturnType<typeof vi.fn>

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
  draw = vi.fn(); deleteBuffer = vi.fn(); deleteProgram = vi.fn(); pointerUniform = vi.fn()
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
    drawArrays: draw, deleteBuffer, deleteProgram, uniform2f: pointerUniform,
  }, { get: (target, key) => key in target ? target[key as keyof typeof target] : /^[A-Z_]+$/.test(String(key)) ? 1 : noop })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(gl as unknown as WebGLRenderingContext)
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('portal accessibility and GPU lifetime', () => {
  it('maps the actual canvas center and follows all four pointer directions with the correct Y axis', () => {
    const wrapper = mount(Harness)
    const surface = wrapper.get('canvas').element
    vi.spyOn(surface, 'getBoundingClientRect').mockReturnValue({ left: 100, top: 200, width: 400, height: 300, right: 500, bottom: 500 } as DOMRect)
    let timestamp = 0
    const move = (clientX: number, clientY: number) => {
      wrapper.element.dispatchEvent(new MouseEvent('pointermove', { clientX, clientY }))
      for (let i = 0; i < 90; i++) {
        const [id, callback] = frames.entries().next().value!
        frames.delete(id)
        callback(timestamp += 1000 / 60)
      }
      return pointerUniform.mock.calls.at(-1)!.slice(1) as number[]
    }
    expect(move(300, 350)).toEqual([0, 0])
    const [left, up] = move(150, 250)
    expect(left).toBeCloseTo(-.75, 1)
    expect(up).toBeCloseTo(2 / 3, 1)
    expect(parseFloat(wrapper.element.style.getPropertyValue('--emblem-y'))).toBeLessThan(0)
    const [right, down] = move(450, 450)
    expect(right).toBeCloseTo(.75, 1)
    expect(down).toBeCloseTo(-2 / 3, 1)
    expect(parseFloat(wrapper.element.style.getPropertyValue('--emblem-y'))).toBeGreaterThan(0)
    wrapper.element.dispatchEvent(new Event('pointerleave'))
    for (let i = 0; i < 90; i++) {
      const [id, callback] = frames.entries().next().value!
      frames.delete(id); callback(timestamp += 1000 / 60)
    }
    const [, x, y] = pointerUniform.mock.calls.at(-1)!
    expect(x).toBeCloseTo(0, 1); expect(y).toBeCloseTo(0, 1)
    wrapper.unmount()
  })

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
