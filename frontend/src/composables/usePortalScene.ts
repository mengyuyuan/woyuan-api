import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

// A small WebGL scene: lit tubular arches, a perspective floor and a GPU particle field.
// The geometry is local and procedural; no model, texture or animation library is downloaded.
const vertexSource = `
precision mediump float;
attribute vec3 aPosition;
attribute vec3 aNormal;
uniform vec2 uPointer;
uniform float uTime, uScroll, uLayer, uMode, uAspect, uIntro;
varying vec3 vNormal, vView;
varying float vFade, vTravel;
mat3 turn(float x, float y) {
  float a=cos(x), b=sin(x), c=cos(y), d=sin(y);
  return mat3(c,b*d,-a*d, 0.,a,b, d,-b*c,a*c);
}
void main() {
  vec3 p=aPosition;
  float t=uTime;
  vFade=1.;
  vTravel=0.;
  if(uMode>0.5 && uMode<1.5) {
    float flow=fract(aPosition.z+t*.045);
    float angle=aPosition.x*6.28318+t*.19;
    float radius=.35+pow(flow,.7)*2.65;
    p=vec3(cos(angle)*radius, sin(angle)*radius*.8-.05, 1.8-flow*6.5);
    p.xy+=uPointer*.22*sin(flow*3.14159);
    p.y+=sin(t*.4+aPosition.y*20.)*.07;
    vFade=sin(flow*3.14159)*(.35+aPosition.y*.65)*uIntro;
    vTravel=flow;
  } else if(uMode<.5) {
    // Each arch opens from a compact cluster and then moves independently in depth.
    p.xy*=mix(.72,1.,uIntro);
    p.z+=sin(t*.45-uLayer*.6)*.12;
    p.y+=sin(t*.35-uLayer*.5)*.035;
    vTravel=aPosition.y*.4+t*.35-uLayer*.45;
  }
  float yaw=.24+sin(t*.18)*.12+uPointer.x*.22+uScroll*.3;
  float pitch=-.08+uPointer.y*.1;
  mat3 rotation=turn(pitch,yaw);
  p=rotation*p;
  p.y+=.12-uScroll*.4;
  float depth=7.5-p.z+uScroll*1.4;
  gl_Position=vec4(p.x*3.0/uAspect,p.y*3.0,depth*1.004008-.200401,depth);
  gl_PointSize=clamp((1.7+aPosition.y*2.3)*1.6/depth*5.,1.,5.);
  vNormal=rotation*aNormal;
  vView=vec3(0.,0.,7.5)-p;
}
`
const fragmentSource = `
precision mediump float;
uniform float uMode, uLayer, uTime, uIntro;
varying vec3 vNormal, vView;
varying float vFade, vTravel;
void main() {
  if(uMode>1.5) { gl_FragColor=vec4(.57,.66,.84,.15*uIntro); return; }
  if(uMode>.5) {
    float r=length(gl_PointCoord-.5)*2.;
    float alpha=(1.-smoothstep(.15,1.,r))*vFade*.8;
    gl_FragColor=vec4(.12,.32,.94,alpha); return;
  }
  vec3 n=normalize(vNormal), view=normalize(vView);
  float light=max(dot(n,normalize(vec3(-.5,1.,1.5))),0.);
  float rim=pow(1.-abs(dot(n,view)),2.5);
  float spec=pow(max(dot(reflect(-normalize(vec3(-.8,1.,2.)),n),view),0.),35.);
  float band=pow(.5+.5*sin(vTravel*4.-uTime*.9),18.);
  vec3 blue=vec3(.12,.29,.85), silver=vec3(.74,.8,.93);
  vec3 base=mix(blue,silver,min(.9,uLayer*.16));
  vec3 color=base*(.34+light*.66)+vec3(spec*.6)+vec3(.18,.32,.65)*rim+band*.12;
  color=mix(vec3(.975,.98,.99),color,uIntro);
  gl_FragColor=vec4(color,1.);
}
`

function archGeometry(layer: number) {
  const positions: number[] = [], normals: number[] = []
  const segments = 100, sides = 10
  const radius = 1.23, leg = 2.05, curve = Math.PI * radius
  const length = leg * 2 + curve
  const tube = layer === 0 ? .062 : .035
  const sample = (u: number, v: number) => {
    const distance = u * length
    let x: number, y: number, nx: number, ny: number
    if (distance < leg) { x = -radius; y = -1.7 + distance; nx = -1; ny = 0 }
    else if (distance < leg + curve) {
      const angle = Math.PI - (distance - leg) / radius
      nx = Math.cos(angle); ny = Math.sin(angle)
      x = nx * radius; y = .35 + ny * radius
    } else { x = radius; y = .35 - (distance - leg - curve); nx = 1; ny = 0 }
    const a = v * Math.PI * 2, c = Math.cos(a), s = Math.sin(a)
    return { p: [x + nx * c * tube, y + ny * c * tube, .9 - layer * .67 + s * tube], n: [nx * c, ny * c, s] }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < sides; j++) {
      const a = sample(i / segments, j / sides), b = sample((i + 1) / segments, j / sides)
      const c = sample((i + 1) / segments, (j + 1) / sides), d = sample(i / segments, (j + 1) / sides)
      for (const point of [a, b, c, a, c, d]) { positions.push(...point.p); normals.push(...point.n) }
    }
  }
  return { positions, normals }
}

export function usePortalScene(stage: Ref<HTMLElement | null>, canvas: Ref<HTMLCanvasElement | null>) {
  const ready = ref(false), paused = ref(false)
  let gl: WebGLRenderingContext | null = null
  let program: WebGLProgram | null = null
  let raf = 0, resizeObserver: ResizeObserver | undefined, observer: IntersectionObserver | undefined
  let preference: MediaQueryList | undefined
  let visible = true, lost = false, stopped = false
  let time = 0, last = 0, intro = 0, scroll = 0, width = 1, height = 1
  let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0
  const buffers: WebGLBuffer[] = []
  const shaders: WebGLShader[] = []
  const meshes: { position: WebGLBuffer; normal: WebGLBuffer; count: number }[] = []
  const uniforms: Record<string, WebGLUniformLocation | null> = {}
  let positionAttribute = -1, normalAttribute = -1
  let particles: typeof meshes[number] | undefined, floor: typeof meshes[number] | undefined

  const cancel = () => { cancelAnimationFrame(raf); raf = 0; last = 0 }
  const canAnimate = () => !paused.value && visible && !document.hidden && !lost && !stopped
  const drawMesh = (mesh: typeof meshes[number], mode: number, layer: number, primitive: number) => {
    if (!gl) return
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.position)
    gl.vertexAttribPointer(positionAttribute, 3, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normal)
    gl.vertexAttribPointer(normalAttribute, 3, gl.FLOAT, false, 0, 0)
    gl.uniform1f(uniforms.uMode!, mode); gl.uniform1f(uniforms.uLayer!, layer)
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
    gl.uniform1f(uniforms.uAspect!, width / height)
    gl.uniform2f(uniforms.uPointer!, pointerX, pointerY)
    gl.enable(gl.DEPTH_TEST); gl.depthMask(true)
    for (let i = meshes.length - 1; i >= 0; i--) drawMesh(meshes[i]!, 0, i, gl.TRIANGLES)
    gl.depthMask(false)
    if (floor) drawMesh(floor, 2, 0, gl.LINES)
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
    if (paused.value) { intro = 1; pointerX = pointerY = targetX = targetY = 0 }
    sync()
  }
  const onPointer = (event: PointerEvent) => {
    if (paused.value || event.pointerType === 'touch' || !stage.value) return
    const rect = stage.value.getBoundingClientRect()
    targetX = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1))
    targetY = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1))
    stage.value.style.setProperty('--emblem-x', `${targetX * 8}px`)
    stage.value.style.setProperty('--emblem-y', `${targetY * 5}px`)
  }
  const onLeave = () => {
    targetX = targetY = 0
    stage.value?.style.removeProperty('--emblem-x'); stage.value?.style.removeProperty('--emblem-y')
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
      for (const name of ['uPointer', 'uTime', 'uScroll', 'uLayer', 'uMode', 'uAspect', 'uIntro']) uniforms[name] = gl.getUniformLocation(program, name)
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
      for (let i = 0; i < 6; i++) { const arch = archGeometry(i); meshes.push(mesh(arch.positions, arch.normals)) }
      const points: number[] = []
      const count = window.matchMedia('(pointer: coarse)').matches ? 220 : 520
      // Deterministic seeds keep the composition stable across reloads.
      for (let i = 0; i < count; i++) points.push((i * .61803398875) % 1, (i * .754877666) % 1, i / count)
      particles = mesh(points)
      const grid: number[] = []
      for (let i = -8; i <= 8; i++) {
        grid.push(i * .45, -1.78, -5, i * .45, -1.78, 3)
        grid.push(-3.6, -1.78, i * .5, 3.6, -1.78, i * .5)
      }
      floor = mesh(grid)
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
