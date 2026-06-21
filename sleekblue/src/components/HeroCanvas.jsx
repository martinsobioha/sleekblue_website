import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function HeroCanvas() {
  const mountRef = useRef(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    // Pre-flight: check WebGL is available before loading Three.js renderer
    const testCanvas = document.createElement('canvas')
    const glCtx = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')
    if (!glCtx) return // No WebGL — silently skip animation

    const w = el.clientWidth || window.innerWidth
    const h = el.clientHeight || 600

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000)
    camera.position.z = 6

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas: document.createElement('canvas'), alpha: true, antialias: true, powerPreference: 'low-power' })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)
      el.appendChild(renderer.domElement)
    } catch {
      return
    }

    // Particle field
    const particleCount = 120
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 18
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const pMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.055, transparent: true, opacity: 0.55 })
    const points = new THREE.Points(pGeo, pMat)
    scene.add(points)

    // Floating wireframe shapes — subtle premium feel
    const shapes = []
    const wireMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.10 })
    const defs = [
      { geo: new THREE.OctahedronGeometry(0.55),   x: -3.5, y: 1.8, z: -1 },
      { geo: new THREE.TetrahedronGeometry(0.7),    x: 3.2,  y: -1.5, z: 0.5 },
      { geo: new THREE.IcosahedronGeometry(0.45),   x: -1.5, y: -2.2, z: 1 },
      { geo: new THREE.OctahedronGeometry(0.35),    x: 2.8,  y: 2.0, z: -0.5 },
      { geo: new THREE.TetrahedronGeometry(0.5),    x: -3.8, y: -0.8, z: 0.8 },
      { geo: new THREE.IcosahedronGeometry(0.3),    x: 1.0,  y: 2.8, z: -1.5 },
    ]
    defs.forEach((d, i) => {
      const mesh = new THREE.Mesh(d.geo, wireMat)
      mesh.position.set(d.x, d.y, d.z)
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
      mesh.userData.rx = 0.003 + Math.random() * 0.004
      mesh.userData.ry = 0.002 + Math.random() * 0.003
      scene.add(mesh)
      shapes.push(mesh)
    })

    // Mouse parallax
    let mouseX = 0, mouseY = 0
    function onMouse(e) {
      mouseX = (e.clientX / window.innerWidth  - 0.5) * 0.6
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.4
    }
    window.addEventListener('mousemove', onMouse)

    let animId
    function animate() {
      animId = requestAnimationFrame(animate)
      // Slow rotation + mouse parallax
      points.rotation.y += 0.0006
      points.rotation.x += 0.0002
      scene.rotation.y += (mouseX - scene.rotation.y) * 0.02
      scene.rotation.x += (-mouseY - scene.rotation.x) * 0.02
      shapes.forEach(m => {
        m.rotation.x += m.userData.rx
        m.rotation.y += m.userData.ry
      })
      renderer.render(scene, camera)
    }
    animate()

    function onResize() {
      if (!el) return
      const nw = el.clientWidth || window.innerWidth
      const nh = el.clientHeight || 600
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      pGeo.dispose()
      pMat.dispose()
      wireMat.dispose()
      defs.forEach(d => d.geo.dispose())
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    />
  )
}
