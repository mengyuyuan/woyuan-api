import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/** A small, event-driven motion layer. No scroll hijacking or animation dependency. */
export function useWoyuanMotion(root: Ref<HTMLElement | null>) {
  let observer: IntersectionObserver | undefined
  let scrollFrame = 0
  let pointerFrame = 0
  let entranceFrame = 0
  let reduced: MediaQueryList | undefined
  let finePointer = false
  let x = 0
  let y = 0
  let target: HTMLElement | null = null
  let activeButton: HTMLElement | null = null
  let activeCard: HTMLElement | null = null

  const resetButton = () => {
    activeButton?.style.removeProperty('--magnetic-x')
    activeButton?.style.removeProperty('--magnetic-y')
    activeButton = null
  }
  const updatePointer = () => {
    pointerFrame = 0
    const el = root.value
    if (!el || reduced?.matches) return
    const art = el.querySelector<HTMLElement>('.wy-portal-art')
    const scene = el.querySelector<HTMLElement>('.wy-portal-scene')
    if (art && scene) {
      const bounds = art.getBoundingClientRect()
      const px = Math.max(-1, Math.min(1, (x - bounds.left) / bounds.width * 2 - 1))
      const py = Math.max(-1, Math.min(1, (y - bounds.top) / bounds.height * 2 - 1))
      scene.style.setProperty('--tilt-x', `${px * 6}deg`)
      scene.style.setProperty('--tilt-y', `${-py * 4}deg`)
    }
    const card = target?.closest<HTMLElement>('.wy-feature, .wy-code-card')
    if (activeCard && activeCard !== card) {
      activeCard.style.removeProperty('--card-rx')
      activeCard.style.removeProperty('--card-ry')
    }
    activeCard = card ?? null
    if (card) {
      const bounds = card.getBoundingClientRect()
      card.style.setProperty('--spot-x', `${x - bounds.left}px`)
      card.style.setProperty('--spot-y', `${y - bounds.top}px`)
      card.style.setProperty('--card-rx', `${-(y - bounds.top - bounds.height / 2) / bounds.height * 4}deg`)
      card.style.setProperty('--card-ry', `${(x - bounds.left - bounds.width / 2) / bounds.width * 5}deg`)
    }
    const button = target?.closest<HTMLElement>('.wy-button') ?? null
    if (button !== activeButton) resetButton()
    if (button) {
      activeButton = button
      const bounds = button.getBoundingClientRect()
      button.style.setProperty('--magnetic-x', `${(x - bounds.left - bounds.width / 2) * .07}px`)
      button.style.setProperty('--magnetic-y', `${(y - bounds.top - bounds.height / 2) * .12}px`)
    }
  }
  const onPointer = (event: PointerEvent) => {
    if (!finePointer || reduced?.matches || event.pointerType === 'touch') return
    x = event.clientX
    y = event.clientY
    target = event.target instanceof HTMLElement ? event.target : null
    if (!pointerFrame) pointerFrame = requestAnimationFrame(updatePointer)
  }
  const onLeave = () => {
    resetButton()
    activeCard?.style.removeProperty('--card-rx')
    activeCard?.style.removeProperty('--card-ry')
    activeCard = null
    const scene = root.value?.querySelector<HTMLElement>('.wy-portal-scene')
    scene?.style.setProperty('--tilt-x', '0deg')
    scene?.style.setProperty('--tilt-y', '0deg')
  }
  const updateScroll = () => {
    scrollFrame = 0
    const max = document.documentElement.scrollHeight - window.innerHeight
    root.value?.style.setProperty('--read-progress', `${max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0}`)
    const manifesto = root.value?.querySelector<HTMLElement>('.wy-manifesto')
    if (manifesto) {
      const top = manifesto.getBoundingClientRect().top
      const progress = Math.max(0, Math.min(1, (window.innerHeight * .95 - top) / (window.innerHeight * .65)))
      manifesto.style.setProperty('--manifesto-progress', `${progress}`)
    }
  }
  const onScroll = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll) }
  const onVisibility = () => { root.value?.classList.toggle('wy-paused', document.hidden) }
  const onPreference = () => {
    root.value?.classList.toggle('wy-reduced-motion', reduced?.matches === true)
    if (reduced?.matches) onLeave()
  }

  onMounted(() => {
    const el = root.value
    if (!el) return
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    onPreference()
    const reveal = el.querySelectorAll<HTMLElement>('[data-reveal]')
    if (typeof IntersectionObserver === 'function' && !reduced.matches) {
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.target.classList.contains('wy-portal-art')) {
            entry.target.classList.toggle('wy-art-paused', !entry.isIntersecting)
            continue
          }
          if (entry.isIntersecting) {
            entry.target.classList.add('wy-revealed')
            observer?.unobserve(entry.target)
          }
        }
      }, { threshold: .08, rootMargin: '0px 0px -32px 0px' })
      reveal.forEach((item, i) => {
        item.style.setProperty('--reveal-delay', `${item.classList.contains('wy-feature') ? i % 3 * 90 : 0}ms`)
        observer?.observe(item)
      })
      const art = el.querySelector('.wy-portal-art')
      if (art) observer.observe(art)
    } else { reveal.forEach(item => item.classList.add('wy-revealed')) }
    entranceFrame = requestAnimationFrame(() => { el.classList.add('wy-motion-ready') })
    el.addEventListener('pointermove', onPointer, { passive: true })
    el.addEventListener('pointerleave', onLeave)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    reduced.addEventListener?.('change', onPreference)
    updateScroll()
  })
  onBeforeUnmount(() => {
    observer?.disconnect()
    cancelAnimationFrame(scrollFrame)
    cancelAnimationFrame(pointerFrame)
    cancelAnimationFrame(entranceFrame)
    root.value?.removeEventListener('pointermove', onPointer)
    root.value?.removeEventListener('pointerleave', onLeave)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    document.removeEventListener('visibilitychange', onVisibility)
    reduced?.removeEventListener?.('change', onPreference)
  })
}
