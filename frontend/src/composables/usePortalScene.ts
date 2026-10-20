import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

import emblemPoints from '@/assets/brand/emblem-points.json'

// The supplied emblem becomes a field of particles. Cursor interaction is evaluated on the GPU.
const vertexSource = `
precision mediump float;
attribute vec3 aPosition, aNormal;
uniform vec2 uPointer;
uniform float uTime, uScroll, uMode, uAspect, uIntro, uHover, uDpr;
varying float vAlpha, vLight;
void main() {
  float t=uTime;
  vec3 p=aPosition;
  float seed=aNormal.x*6.28318;
  float settled=1.-pow(1.-uIntro,4.);
  vLight=0.;
  if(uMode<.5) {
    vec3 cloud=vec3(cos(seed)*3.6,sin(seed)*3.6,sin(seed*2.)*2.);
    p+=cloud*(1.-settled);
    p.z+=sin(seed+t*.45)*.025;
    p.y+=sin(t*.5)*.04;
    p.xy+=vec2(cos(seed+t*.1),sin(seed+t*.1))*uScroll*.28;
    vAlpha=mix(.18,1.,settled);
  } else {
    float a=aPosition.x*6.28318+t*.06;
    float r=1.8+aPosition.y*1.1;
    p=vec3(cos(a)*r,sin(a)*r*.8,sin(a+t*.08)*.5-1.);
    vAlpha=(.12+sin(seed+t*.5)*.07)*settled;
    vLight=step(.93,aNormal.y);
  }
  float yaw=sin(t*.15)*.045+uPointer.x*.08;
  float c=cos(yaw),s=sin(yaw);
  p.xz=mat2(c,-s,s,c)*p.xz;
  // Both axes use WebGL coordinates. The whole field follows the pointer gently.
  p.xy+=uPointer*vec2(uAspect,1.)*.08;
  float depth=6.8-p.z+uScroll*.5;
  if(uMode<.5) {
    // Unproject the pointer onto this particle's depth after the view rotation.
    vec2 cursor=uPointer*vec2(uAspect,1.)*depth/2.9;
    vec2 delta=p.xy-cursor;
    float influence=(1.-smoothstep(0.,.7,length(delta)))*uHover;
    p.xy+=normalize(delta+vec2(.001))*influence*.16;
    p.z+=influence*.12;
    depth=6.8-p.z+uScroll*.5;
    vLight=influence;
  }
  gl_Position=vec4(p.x*2.9/uAspect,p.y*2.9,depth*1.004008-.200401,depth);
  gl_PointSize=(uMode<.5?2.05:1.3)*uDpr*6.8/depth;
}
`
const fragmentSource = `
precision mediump float;
varying float vAlpha,vLight;
void main() {
  float radius=length(gl_PointCoord-.5)*2.;
  float alpha=(1.-smoothstep(.45,1.,radius))*vAlpha;
  gl_FragColor=vec4(mix(vec3(.055,.065,.08),vec3(.16,.34,.94),vLight),alpha);
}
`

export function usePortalScene(stage: Ref<HTMLElement | null>, canvas: Ref<HTMLCanvasElement | null>) {
  const ready = ref(false), paused = ref(false)
  let gl: WebGLRenderingContext | null = null
  let program: WebGLProgram | null = null
  let raf = 0, resizeObserver: ResizeObserver | undefined, observer: IntersectionObserver | undefined
  let preference: MediaQueryList | undefined
  let visible = true, lost = false, stopped = false
  let time = 0, last = 0, intro = 0, scroll = 0, width = 1, height = 1
  let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0, hover = 0, targetHover = 0
  const buffers: WebGLBuffer[] = []
  const shaders: WebGLShader[] = []
  const meshes: { position: WebGLBuffer; normal: WebGLBuffer; count: number }[] = []
  const uniforms: Record<string, WebGLUniformLocation | null> = {}
  let positionAttribute = -1, normalAttribute = -1
  let particles: typeof meshes[number] | undefined

  const cancel = () => { cancelAnimationFrame(raf); raf = 0; last = 0 }
  const canAnimate = () => !paused.value && visible && !document.hidden && !lost && !stopped
  const drawMesh = (mesh: typeof meshes[number], mode: number, layer: number, primitive: number) => {
    if (!gl) return
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.position)
    gl.vertexAttribPointer(positionAttribute, 3, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normal)
    gl.vertexAttribPointer(normalAttribute, 3, gl.FLOAT, false, 0, 0)
    gl.uniform1f(uniforms.uMode!, mode); void layer
    gl.drawArrays(primitive, 0, mesh.count)
  }
  const draw = () => {
    if (!gl || !program || lost || stopped) return
    gl.viewport(0, 0, width, height)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.useProgram(program)
    gl.uniform1f(uniforms.uTime!, time)
    gl.uniform1f(uniforms.uScroll!, scroll)
    gl.uniform1f(uniforms.uIntro!, intro)
    gl.uniform1f(uniforms.uHover!, hover)
    gl.uniform1f(uniforms.uDpr!, width / Math.max(1, canvas.value?.getBoundingClientRect().width || width))
    gl.uniform1f(uniforms.uAspect!, width / height)
    gl.uniform2f(uniforms.uPointer!, pointerX, pointerY)
    // CSS uses downward-positive Y, while the shader uses upward-positive Y.
    stage.value?.style.setProperty('--emblem-x', `${pointerX * 8}px`)
    stage.value?.style.setProperty('--emblem-y', `${-pointerY * 5}px`)
    gl.enable(gl.DEPTH_TEST); gl.depthMask(true)
    for (let i = meshes.length - 1; i >= 0; i--) drawMesh(meshes[i]!, 0, i, gl.POINTS)
    gl.depthMask(false)
    if (particles) drawMesh(particles, 1, 0, gl.POINTS)
    gl.depthMask(true)
  }
  const frame = (now: number) => {
    raf = 0
    if (!canAnimate()) { last = 0; return }
    const dt = last ? Math.min((now - last) / 1000, .05) : 1 / 60
    last = now; time += dt
    intro = Math.min(1, intro + dt / 2.2)
    const easing = 1 - Math.exp(-dt * 3)
    pointerX += (targetX - pointerX) * easing
    pointerY += (targetY - pointerY) * easing
    hover += (targetHover - hover) * easing
    draw()
    raf = requestAnimationFrame(frame)
  }
  const sync = () => {
    if (canAnimate()) { if (!raf && ready.value) raf = requestAnimationFrame(frame) }
    else { cancel(); if (ready.value) draw() }
  }
  const toggle = () => { paused.value = !paused.value; sync() }
  const onPreference = () => {
    paused.value = preference?.matches === true
    if (paused.value) { intro = 1; pointerX = pointerY = targetX = targetY = hover = targetHover = 0 }
    sync()
  }
  const onPointer = (event: PointerEvent) => {
    if (paused.value || event.pointerType === 'touch' || !canvas.value) return
    const rect = canvas.value.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    targetHover = 1
    targetX = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1))
    targetY = Math.max(-1, Math.min(1, 1 - (event.clientY - rect.top) / rect.height * 2))
  }
  const onLeave = () => {
    targetX = targetY = targetHover = 0
  }
  const onScroll = () => {
    if (!stage.value || paused.value) return
    const rect = stage.value.getBoundingClientRect()
    scroll = Math.max(0, Math.min(1, -rect.top / (rect.height + 100)))
  }
  const onLost = (event: Event) => {
    event.preventDefault(); lost = true; ready.value = false; cancel()
  }
  const onRestored = () => {
    lost = false; buffers.length = 0; shaders.length = 0; meshes.length = 0
    initialize()
  }
  const resize = () => {
    if (!canvas.value) return
    const rect = canvas.value.getBoundingClientRect()
    // Limit pixel cost on high DPI screens, especially mobile devices.
    const ratio = Math.min(window.devicePixelRatio || 1, window.matchMedia('(pointer: coarse)').matches ? 1.25 : 1.75)
    width = Math.max(1, Math.round(rect.width * ratio)); height = Math.max(1, Math.round(rect.height * ratio))
    canvas.value.width = width; canvas.value.height = height
    draw()
  }
  const initialize = () => {
    if (!canvas.value || !gl) return
    try {
      const compile = (type: number, source: string) => {
        const shader = gl!.createShader(type)
        if (!shader) throw new Error('Shader unavailable')
        shaders.push(shader); gl!.shaderSource(shader, source); gl!.compileShader(shader)
        if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) throw new Error(gl!.getShaderInfoLog(shader) || 'Shader compilation failed')
        return shader
      }
      program = gl.createProgram()
      if (!program) throw new Error('Program unavailable')
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource))
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource))
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Program linking failed')
      positionAttribute = gl.getAttribLocation(program, 'aPosition'); normalAttribute = gl.getAttribLocation(program, 'aNormal')
      for (const name of ['uPointer', 'uTime', 'uScroll', 'uMode', 'uAspect', 'uIntro', 'uHover', 'uDpr']) uniforms[name] = gl.getUniformLocation(program, name)
      const mesh = (positions: number[], normals = new Array(positions.length).fill(0)) => {
        const upload = (data: number[]) => {
          const buffer = gl!.createBuffer()
          if (!buffer) throw new Error('Buffer unavailable')
          buffers.push(buffer); gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer)
          gl!.bufferData(gl!.ARRAY_BUFFER, new Float32Array(data), gl!.STATIC_DRAW)
          return buffer
        }
        return { position: upload(positions), normal: upload(normals), count: positions.length / 3 }
      }
      const seeds: number[] = []
      for (let i = 0; i < emblemPoints.length / 3; i++) seeds.push((i * .61803398875) % 1, (i * .754877666) % 1, 0)
      meshes.push(mesh(emblemPoints, seeds))
      const points: number[] = [], dustSeeds: number[] = []
      for (let i = 0; i < 280; i++) {
        points.push((i * .61803398875) % 1, (i * .754877666) % 1, 0)
        dustSeeds.push((i * .41421356) % 1, (i * .7320508) % 1, 0)
      }
      particles = mesh(points, dustSeeds)
      gl.enableVertexAttribArray(positionAttribute); gl.enableVertexAttribArray(normalAttribute)
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.clearColor(0, 0, 0, 0)
      if (paused.value) intro = 1
      ready.value = true; resize(); sync()
    } catch (error) {
      if (import.meta.env.DEV) console.warn('[Woyuan portal] Static fallback:', error)
      ready.value = false; cancel()
      for (const buffer of buffers) gl.deleteBuffer(buffer)
      for (const shader of shaders) gl.deleteShader(shader)
      if (program) gl.deleteProgram(program)
      buffers.length = 0; shaders.length = 0; meshes.length = 0; program = null
    }
  }
  onMounted(() => {
    const el = stage.value, surface = canvas.value
    if (!el || !surface || typeof ResizeObserver !== 'function') return
    preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    paused.value = preference.matches
    // A static CSS composition remains visible if WebGL is unavailable.
    try { gl = surface.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'low-power', preserveDrawingBuffer: false }) }
    catch { return }
    if (!gl) return
    el.addEventListener('pointermove', onPointer, { passive: true }); el.addEventListener('pointerleave', onLeave)
    surface.addEventListener('webglcontextlost', onLost); surface.addEventListener('webglcontextrestored', onRestored)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', sync); preference.addEventListener?.('change', onPreference)
    resizeObserver = new ResizeObserver(resize); resizeObserver.observe(surface)
    if (typeof IntersectionObserver === 'function') {
      observer = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? true; el.classList.toggle('wy-art-paused', !visible); sync() }, { threshold: 0 })
      observer.observe(el)
    }
    initialize()
  })
  onBeforeUnmount(() => {
    stopped = true; cancel(); observer?.disconnect(); resizeObserver?.disconnect()
    stage.value?.removeEventListener('pointermove', onPointer); stage.value?.removeEventListener('pointerleave', onLeave)
    canvas.value?.removeEventListener('webglcontextlost', onLost); canvas.value?.removeEventListener('webglcontextrestored', onRestored)
    window.removeEventListener('scroll', onScroll); document.removeEventListener('visibilitychange', sync)
    preference?.removeEventListener?.('change', onPreference)
    if (gl) {
      for (const buffer of buffers) gl.deleteBuffer(buffer)
      for (const shader of shaders) gl.deleteShader(shader)
      if (program) gl.deleteProgram(program)
    }
  })
  return { ready, paused, toggle }
}
