"use client"

import { useEffect, useRef, type RefObject } from "react"
import gsap from "gsap"

interface CinematicTransitionProps {
  slidesRef: RefObject<Array<HTMLElement | null>>
  heroVisualRef: RefObject<HTMLDivElement | null>
  onActiveSlideChange: (index: number) => void
}

interface TransitionUniforms {
  progress: WebGLUniformLocation | null
  resolution: WebGLUniformLocation | null
  time: WebGLUniformLocation | null
  apex: WebGLUniformLocation | null
  curvature: WebGLUniformLocation | null
  noiseIntensity: WebGLUniformLocation | null
  noiseConcentration: WebGLUniformLocation | null
  propagation: WebGLUniformLocation | null
  distortion: WebGLUniformLocation | null
  chromaticAberration: WebGLUniformLocation | null
  glitch: WebGLUniformLocation | null
}

const vertexShaderSource = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`

const fragmentShaderSource = `
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uProgress;
uniform vec2 uApex;
uniform float uCurvature;
uniform float uNoiseIntensity;
uniform float uNoiseConcentration;
uniform float uPropagation;
uniform float uDistortion;
uniform float uChromaticAberration;
uniform float uGlitch;

const vec3 solidFill = vec3(0.22, 0.24, 0.10);

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

vec2 channelDisplacement(vec2 edgePoint, float time, float seed) {
    float direction = noise(edgePoint * 4.2 + vec2(seed * 13.0 + time * 0.22, seed * 2.1 + time * 0.15)) * 6.2831853;
    float magnitude = mix(0.0, 0.023, noise(edgePoint * 7.0 + vec2(seed * 5.0 + time * 0.18, seed * 11.0 + time * 0.12)));
    return vec2(cos(direction), sin(direction)) * magnitude;
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    float aspect = uResolution.x / uResolution.y;
    float progress = clamp(uProgress, 0.0, 1.0);

    // The whole shape is ONE family of circular arcs described by a signed curvature k:
    //   k < 0 hanging catenary (smile) / k = 0 flat / k > 0 dome, and finally the circle.
    // Because nothing is switched or cross-faded between shapes, every in-between frame is
    // simply a pass-through point of the same continuous path.
    // Coordinates are relative to the arc apex, in screen-height units.
    float ax = (uv.x - uApex.x) * aspect;
    float ay = uv.y - uApex.y;
    float k = uCurvature;
    float arcRoot = sqrt((1.0 + k * ay) * (1.0 + k * ay) + k * k * ax * ax);
    // Signed distance to the arc (exact circle SDF for k > 0, stable for k -> 0).
    float baseDistance = (2.0 * ay + k * (ax * ax + ay * ay)) / (1.0 + arcRoot);
    // A hanging arc is the lower part of a circle whose centre is above it: fill only below the centre.
    if (k < -0.0001) {
        baseDistance = max(baseDistance, ay + 1.0 / k);
    }

    // Far from the edge nothing but the flat fill can change, so skip the expensive noise.
    float guardBand = 0.04 + 0.023 * uChromaticAberration * max(1.0, uGlitch);
    if (abs(baseDistance) > guardBand) {
        gl_FragColor = baseDistance < 0.0 ? vec4(solidFill, 1.0) : vec4(0.0);
        return;
    }

    // Eased in over wide windows so that none of these effects pops on or off.
    float circleBlend = smoothstep(0.25, 1.5, k);
    float edgeVisibility = smoothstep(0.3, 0.7, progress);
    float liquidNoiseProgress = smoothstep(0.55, 0.92, progress);

    float curveX = clamp((uv.x - uApex.x) * 2.0, -1.0, 1.0);
    float edgeMask = 1.0 - smoothstep(0.005, 0.03, abs(baseDistance));
    // Outward normal of the arc; valid for every curvature and equal to the old circle normal for k > 0.
    vec2 arcNormal = vec2(k * ax, 1.0 + k * ay) / max(arcRoot, 0.0001);
    vec2 edgePoint = mix(vec2(curveX, 0.0), arcNormal, circleBlend);
    vec2 warp = vec2(
        noise(edgePoint * 3.2 + vec2(uTime * 0.16, 0.0)),
        noise(edgePoint * 3.2 + vec2(5.2, 1.3 + uTime * 0.16))
    ) - 0.5;
    vec2 warpedPoint = edgePoint + warp * 0.18;
    float broadField = noise(warpedPoint * 8.0 + vec2(uPropagation * 1.4, uTime * 0.26));
    float detailField = noise(warpedPoint * 22.0 + vec2(2.4, uTime * 0.44));
    float microField = noise(warpedPoint * 48.0 + vec2(7.1 + uPropagation * 0.9, uTime * 0.68));
    float ridgeField = 1.0 - abs(2.0 * broadField - 1.0);
    float contourField = mix(broadField, ridgeField, 0.38);
    contourField = mix(contourField, detailField, 0.25);
    contourField = mix(contourField, microField, 0.22);
    float steppedContour = floor(contourField * 9.0) / 8.0;
    contourField = mix(contourField, steppedContour, 0.4);
    float organicDistortion = (contourField - 0.5) * 0.03 * uNoiseIntensity * uDistortion * liquidNoiseProgress * edgeMask;

    float glitchCell = floor(gl_FragCoord.x / 8.0);
    float columnNoise = noise(vec2(glitchCell * 0.31, uTime * 0.38 + uPropagation * 0.14));
    float glitchColumn = smoothstep(0.70, 0.97, columnNoise);
    float steppedColumn = floor(columnNoise * 5.0) / 4.0;
    float digitalEdgeMask = 1.0 - smoothstep(0.004, 0.03, abs(baseDistance));
    float verticalOffset = (mix(columnNoise, steppedColumn, 0.62) - 0.5) * 0.045 * glitchColumn * uGlitch * digitalEdgeMask;
    float distortedDistance = baseDistance + organicDistortion + verticalOffset;
    float edgeWidth = 0.0011 + uNoiseConcentration * 0.00075;
    float baseFill = 1.0 - smoothstep(-edgeWidth, edgeWidth, baseDistance);
    float chromaVisibility = max(edgeVisibility, glitchColumn * uGlitch);
    vec2 edgeNormal = arcNormal;
    vec2 redShift = channelDisplacement(edgePoint, uTime, 3.0) * uChromaticAberration * chromaVisibility;
    vec2 greenShift = channelDisplacement(edgePoint, uTime, 19.0) * uChromaticAberration * chromaVisibility;
    vec2 blueShift = channelDisplacement(edgePoint, uTime, 47.0) * uChromaticAberration * chromaVisibility;
    float redOffset = dot(redShift, edgeNormal);
    float greenOffset = dot(greenShift, edgeNormal);
    float blueOffset = dot(blueShift, edgeNormal);
    redOffset = min(redOffset, 0.0) + max(redOffset, 0.0) * 0.42;
    greenOffset = min(greenOffset, 0.0) + max(greenOffset, 0.0) * 0.42;
    blueOffset = min(blueOffset, 0.0) + max(blueOffset, 0.0) * 0.42;
    float redFill = 1.0 - smoothstep(-edgeWidth, edgeWidth, distortedDistance + redOffset);
    float greenFill = 1.0 - smoothstep(-edgeWidth, edgeWidth, distortedDistance + greenOffset);
    float blueFill = 1.0 - smoothstep(-edgeWidth, edgeWidth, distortedDistance + blueOffset);
    baseFill = min(redFill, min(greenFill, blueFill));
    float redLayer = abs(redFill - baseFill);
    float greenLayer = abs(greenFill - baseFill);
    float blueLayer = abs(blueFill - baseFill);
    vec3 additiveOverlay = vec3(redLayer, greenLayer, blueLayer);
    float overlayAlpha = max(redLayer, max(greenLayer, blueLayer));
    vec3 premultipliedColor = solidFill * baseFill + additiveOverlay;
    float alpha = clamp(baseFill + overlayAlpha, 0.0, 1.0);
    vec3 color = clamp(premultipliedColor / max(alpha, 0.0001), 0.0, 1.0);

    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
}
`

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const x = clamp01((value - edge0) / (edge1 - edge0))
  return x * x * (3 - 2 * x)
}
const sineInOut = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(x))

// 全体の時間配分。円が画面の下端から離れる(=円として閉じる)のは全体の約6割で、
// 残りの約4割は減速しながら最終位置へ着地する。
const transitionDuration = 1.5
// Beta(2,3) の累積分布。立ち上がりは滑らかに加速し、約1/3で最速になり、終端では
// 速度も加速度も0になる非対称イージング(終盤を長く、柔らかく着地させる)。
const settleEase = (t: number) => {
  const x = clamp01(t)
  return x * x * (6 - 8 * x + 3 * x * x)
}

// ヒーロー→開催情報の切り替えは、円が画面中央を覆っている区間(時間比)に収める。
// 覆われている間に入れ替えが終わるので、円が引いて画面が現れるときに前のスライドが残らない。
const contentSwapStart = 0.36
const contentSwapEnd = 0.52
const heroShrinkStart = 0.56

type CurveKeys = ReadonlyArray<readonly [number, number]>

// 通過点(キー)を滑らかにつなぐ単調3次エルミート補間(PCHIP)。
// 各通過点で速度が連続し、行き過ぎ(オーバーシュート)もしない。両端の速度は0。
function createCurve(keys: CurveKeys) {
  const n = keys.length
  const xs = keys.map((key) => key[0])
  const ys = keys.map((key) => key[1])
  const h: number[] = []
  const m: number[] = []
  for (let i = 0; i < n - 1; i++) {
    h.push(xs[i + 1] - xs[i])
    m.push((ys[i + 1] - ys[i]) / h[i])
  }
  const d: number[] = new Array(n).fill(0)
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] > 0) {
      const w1 = 2 * h[i] + h[i - 1]
      const w2 = h[i] + 2 * h[i - 1]
      d[i] = (w1 + w2) / (w1 / m[i - 1] + w2 / m[i])
    }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0]
    if (x >= xs[n - 1]) return ys[n - 1]
    let i = 0
    while (x > xs[i + 1]) i++
    const t = (x - xs[i]) / h[i]
    const t2 = t * t
    const t3 = t2 * t
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h[i] * d[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h[i] * d[i + 1]
    )
  }
}

// 経路上の位置 u(0〜1)に対するエフェクト強度の通過点。u=0.4 は旧実装の「円への変形開始」に相当する。
const effectCurves = {
  noiseIntensity: createCurve([[0, 0.55], [0.4, 1.35], [1, 1.18]]),
  noiseConcentration: createCurve([[0, 0.08], [0.4, 1.7], [1, 0.95]]),
  propagation: createCurve([[0, 0], [0.4, 0.58], [1, 1]]),
  distortion: createCurve([[0, 0.015], [0.4, 1.2], [1, 0.95]]),
  chromaticAberration: createCurve([[0, 0.85], [0.4, 1.5], [1, 1.25]]),
  // グリッチは変形の山場(u=0.55)で最大になり、円が閉じきる前(u=0.8)までに滑らかに消える。
  glitch: createCurve([[0, 0.55], [0.4, 0.75], [0.55, 1], [0.8, 0], [1, 0]]),
}

// 画面サイズに依存する経路の端点。リサイズ・回転のたびに計算し直す。
function computeGeometry() {
  const width = window.innerWidth
  const height = window.innerHeight
  const aspect = width / height
  const arcSagitta = 0.07
  const halfChord = aspect / 2
  // 画面の左右端でちょうど arcSagitta だけ垂れる(持ち上がる)円弧の曲率。
  const edgeCurvature = (2 * arcSagitta) / (halfChord * halfChord + arcSagitta * arcSagitta)
  const initialHeroEdge = 1 - (height - (width >= 768 ? 80 : 64)) / height
  const finalRadius = Math.min(0.17, aspect * 0.36)
  const finalCircleCenterY = 0.735
  // 曲率κは κ = edgeCurvature * sinh(s) で表し、s を直線的に動かす。
  // こうすると κ=0(平ら)を滑らかに通過し、その後は半径が一定比率で縮むので、円が閉じる速さが偏らない。
  return {
    aspect,
    edgeCurvature,
    curvatureStart: -Math.asinh(1),
    curvatureEnd: Math.asinh(1 / finalRadius / edgeCurvature),
    arcStartY: initialHeroEdge + 0.08,
    circleTopY: finalCircleCenterY + finalRadius,
    finalCircleX: Math.min(0.5, finalRadius / aspect + 0.045),
  }
}

export default function CinematicTransition({ slidesRef, heroVisualRef, onActiveSlideChange }: CinematicTransitionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeSlideRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const heroVisual = heroVisualRef.current
    const slides = slidesRef.current
    if (!canvas || !heroVisual || slides.length < 5 || slides.some((slide) => !slide)) return

    const slideElements = slides as HTMLElement[]
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
      premultipliedAlpha: false,
    })

    let vertexShader: WebGLShader | null = null
    let fragmentShader: WebGLShader | null = null
    let program: WebGLProgram | null = null
    let buffer: WebGLBuffer | null = null
    let uniforms: TransitionUniforms | null = null
    let shaderReady = false

    if (gl) {
      vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
      fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
      if (vertexShader && fragmentShader) {
        program = gl.createProgram()
        if (program) {
          gl.attachShader(program, vertexShader)
          gl.attachShader(program, fragmentShader)
          gl.linkProgram(program)
          shaderReady = Boolean(gl.getProgramParameter(program, gl.LINK_STATUS))
        }
      }

      if (shaderReady && program) {
        const linkedProgram = program
        gl.useProgram(linkedProgram)
        buffer = gl.createBuffer()
        if (buffer) {
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
          const position = gl.getAttribLocation(linkedProgram, "position")
          gl.enableVertexAttribArray(position)
          gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
          const uniform = (name: string) => gl.getUniformLocation(linkedProgram, name)
          uniforms = {
            progress: uniform("uProgress"),
            resolution: uniform("uResolution"),
            time: uniform("uTime"),
            apex: uniform("uApex"),
            curvature: uniform("uCurvature"),
            noiseIntensity: uniform("uNoiseIntensity"),
            noiseConcentration: uniform("uNoiseConcentration"),
            propagation: uniform("uPropagation"),
            distortion: uniform("uDistortion"),
            chromaticAberration: uniform("uChromaticAberration"),
            glitch: uniform("uGlitch"),
          }
        } else {
          shaderReady = false
        }
      } else {
        shaderReady = false
      }
    }

    let geometry = computeGeometry()
    const values = {
      progress: 0,
      apexX: 0.5,
      apexY: geometry.arcStartY,
      curvature: -geometry.edgeCurvature,
      noiseIntensity: 0.55,
      noiseConcentration: 0.08,
      propagation: 0,
      distortion: 0.015,
      chromaticAberration: 0.85,
      glitch: 0.55,
    }
    // 最初の遷移の時間(0〜1)。GSAP はこれだけを動かし、形・エフェクト・スライドはすべてここから導く。
    const clock = { t: 0 }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    let animationFrame = 0
    let lastFrame = 0
    let disposed = false
    let isTransitioning = false
    let wheelDelta = 0
    let wheelDirection = 0
    let touchStartX = 0
    let touchStartY = 0
    let touchConsumed = false
    let cooldownUntil = 0
    let firstTransitionTarget = 1

    document.documentElement.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    window.scrollTo(0, 0)

    // 時間 t から形とエフェクトを決める。形は「曲率・頂点の高さ・頂点の横位置」の3つだけで、
    // カテナリー→平ら→上向きの円弧→円は、同じ経路上の通過点として連続してつながる。
    const updateShape = (time: number) => {
      const u = settleEase(time)
      values.progress = u
      values.curvature = geometry.edgeCurvature * Math.sinh(lerp(geometry.curvatureStart, geometry.curvatureEnd, u))
      values.apexY = lerp(geometry.arcStartY, geometry.circleTopY, u)
      values.apexX = lerp(0.5, geometry.finalCircleX, smoothstep(0.25, 1, u))
      values.noiseIntensity = effectCurves.noiseIntensity(u)
      values.noiseConcentration = effectCurves.noiseConcentration(u)
      values.propagation = effectCurves.propagation(u)
      values.distortion = effectCurves.distortion(u)
      values.chromaticAberration = effectCurves.chromaticAberration(u)
      values.glitch = effectCurves.glitch(u)
    }

    const updateSlides = (time: number) => {
      const swap = sineInOut((time - contentSwapStart) / (contentSwapEnd - contentSwapStart))
      slideElements[0].style.opacity = String(1 - swap)
      slideElements[1].style.opacity = String(swap)
      const shrink = sineInOut((time - heroShrinkStart) / (1 - heroShrinkStart))
      gsap.set(heroVisual, { scale: lerp(1, 0.16, shrink), opacity: lerp(1, 0.72, shrink), transformOrigin: "12% 22%" })
    }

    const resizeCanvas = () => {
      if (!gl || !shaderReady) return
      const dpr = Math.min(window.devicePixelRatio || 1, 1.35)
      const width = Math.max(1, Math.round(window.innerWidth * dpr))
      const height = Math.max(1, Math.round(window.innerHeight * dpr))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        gl.viewport(0, 0, width, height)
      }
    }

    // 画面サイズや向きが変わったら、経路の端点(最終の円の大きさ・位置)も計算し直す。
    const onResize = () => {
      geometry = computeGeometry()
      updateShape(clock.t)
      resizeCanvas()
    }

    const render = (timestamp: number) => {
      if (disposed || !gl || !program || !uniforms) return
      animationFrame = window.requestAnimationFrame(render)
      // 遷移中は画面のリフレッシュレートで描く(30fpsだと動きがコマ落ちして途切れて見える)。
      // 待機中の縁のゆらぎだけは負荷を抑えて30fpsにする。
      if (!isTransitioning && timestamp - lastFrame < 32) return
      lastFrame = timestamp
      resizeCanvas()
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(program)
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height)
      gl.uniform1f(uniforms.time, reducedMotion.matches ? 0 : timestamp * 0.001)
      gl.uniform1f(uniforms.progress, values.progress)
      gl.uniform2f(uniforms.apex, values.apexX, values.apexY)
      gl.uniform1f(uniforms.curvature, values.curvature)
      gl.uniform1f(uniforms.noiseIntensity, values.noiseIntensity)
      gl.uniform1f(uniforms.noiseConcentration, values.noiseConcentration)
      gl.uniform1f(uniforms.propagation, values.propagation)
      gl.uniform1f(uniforms.distortion, values.distortion)
      gl.uniform1f(uniforms.chromaticAberration, values.chromaticAberration)
      gl.uniform1f(uniforms.glitch, values.glitch)
      gl.enable(gl.BLEND)
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    updateShape(0)
    if (shaderReady) {
      resizeCanvas()
      animationFrame = window.requestAnimationFrame(render)
    }

    const finishTransition = (index: number) => {
      activeSlideRef.current = index
      onActiveSlideChange(index)
      isTransitioning = false
      wheelDelta = 0
      wheelDirection = 0
      cooldownUntil = Date.now() + 220
    }

    // 終端では必ず最終値に揃えてから完了させる(途中フレームの丸め誤差を残さない)。
    const settleFirstTransition = (time: number) => {
      clock.t = time
      updateShape(time)
      updateSlides(time)
      finishTransition(firstTransitionTarget)
    }

    const firstTimeline = gsap.timeline({
      paused: true,
      onComplete: () => settleFirstTransition(1),
      onReverseComplete: () => settleFirstTransition(0),
    })
    firstTimeline.to(clock, {
      t: 1,
      duration: transitionDuration,
      ease: "none",
      onUpdate: () => {
        updateShape(clock.t)
        updateSlides(clock.t)
      },
    }, 0)

    const beginTransition = (direction: 1 | -1) => {
      if (isTransitioning || Date.now() < cooldownUntil) return
      const currentIndex = activeSlideRef.current
      const nextIndex = currentIndex + direction
      if (nextIndex < 0 || nextIndex >= slideElements.length) return

      isTransitioning = true
      wheelDelta = 0
      wheelDirection = 0

      if (reducedMotion.matches) {
        gsap.set(slideElements[currentIndex], { clearProps: "opacity,transform" })
        gsap.set(slideElements[nextIndex], { clearProps: "opacity,transform" })
        finishTransition(nextIndex)
        return
      }

      if (currentIndex === 0 && nextIndex === 1) {
        firstTransitionTarget = 1
        firstTimeline.play(0)
        return
      }

      if (currentIndex === 1 && nextIndex === 0) {
        firstTransitionTarget = 0
        firstTimeline.reverse()
        return
      }

      const outgoing = slideElements[currentIndex]
      const incoming = slideElements[nextIndex]
      const directionSign = direction
      gsap.set([outgoing, incoming], { clearProps: "transform" })
      gsap.timeline({
        onComplete: () => {
          gsap.set([outgoing, incoming], { clearProps: "transform" })
          finishTransition(nextIndex)
        },
      })
        .to(outgoing, { opacity: 0, y: -directionSign * 24, duration: 0.62, ease: "power2.inOut" }, 0)
        .fromTo(incoming, { opacity: 0, y: directionSign * 24 }, { opacity: 1, y: 0, duration: 0.62, ease: "power2.inOut" }, 0)
    }

    const isInsideHeader = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest("header"))

    const onWheel = (event: WheelEvent) => {
      if (isInsideHeader(event.target) || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      event.preventDefault()
      if (isTransitioning || Date.now() < cooldownUntil) return
      const multiplier = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? window.innerHeight : 1
      const delta = event.deltaY * multiplier
      const direction = Math.sign(delta)
      if (direction !== wheelDirection) {
        wheelDelta = 0
        wheelDirection = direction
      }
      wheelDelta += delta
      if (Math.abs(wheelDelta) >= 56) beginTransition(direction as 1 | -1)
    }

    const onTouchStart = (event: TouchEvent) => {
      if (isInsideHeader(event.target)) return
      const touch = event.touches[0]
      touchStartX = touch.clientX
      touchStartY = touch.clientY
      touchConsumed = false
    }

    const onTouchMove = (event: TouchEvent) => {
      if (isInsideHeader(event.target)) return
      const touch = event.touches[0]
      const deltaX = touchStartX - touch.clientX
      const deltaY = touchStartY - touch.clientY
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.15) return
      event.preventDefault()
      if (touchConsumed || isTransitioning || Date.now() < cooldownUntil || Math.abs(deltaY) < 56) return
      touchConsumed = true
      beginTransition(deltaY > 0 ? 1 : -1)
    }

    const onTouchEnd = () => {
      touchConsumed = false
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof HTMLElement && target.closest("a,button,input,textarea,select,[contenteditable='true']")) return
      if (["ArrowDown", "PageDown", " "].includes(event.key)) {
        event.preventDefault()
        beginTransition(1)
      } else if (["ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault()
        beginTransition(-1)
      }
    }

    window.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: false })
    window.addEventListener("touchend", onTouchEnd, { passive: true })
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("resize", onResize, { passive: true })

    return () => {
      disposed = true
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("touchend", onTouchEnd)
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("resize", onResize)
      firstTimeline.kill()
      gsap.killTweensOf([...slideElements, values, clock, heroVisual])
      if (gl && buffer) gl.deleteBuffer(buffer)
      if (gl && program) gl.deleteProgram(program)
      if (gl && vertexShader) gl.deleteShader(vertexShader)
      if (gl && fragmentShader) gl.deleteShader(fragmentShader)
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
    }
  }, [heroVisualRef, onActiveSlideChange, slidesRef])

  return <canvas ref={canvasRef} aria-hidden="true" className="cinematic-transition-canvas" />
}