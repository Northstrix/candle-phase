'use client';

import { useRef, useEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { Mesh } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useIntl } from 'react-intl';

export interface CameraState {
    position: [number, number, number];
    quaternion: [number, number, number, number];
    target: [number, number, number];
    zoom: number;
}

export interface CandleProps {
  candleHeight: number;
  initialCandleHeight: number;
  candleWidth: number;
  flameColor: string;
  waxColor: string;
  baseColor: string;
  rulerColor: string;
  rulerLabelColor: string;
  cameraState?: CameraState;
  onCameraChange?: (state: CameraState) => void;
}

const candleVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const candleFragmentShader = `
  uniform vec3 uWaxColor;
  uniform float uMeltLevel;
  uniform float uTime;
  varying vec2 vUv;

  float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  void main() {
    vec3 finalColor = uWaxColor;
    
    // Melting effect
    float blendZone = 0.05;
    float meltRegion = 1.0 - uMeltLevel;
    float meltFactor = smoothstep(meltRegion, meltRegion + blendZone, vUv.y);
    finalColor = mix(uWaxColor * 1.1, finalColor, meltFactor);

     // Drips (Cartoonish)
    float dripCount = 10.0;
    for (float i = 0.0; i < dripCount; i++) {
        float dripSeed = i / dripCount;
        float dripX = random(vec2(dripSeed, dripSeed));
        float dripSpeed = random(vec2(dripSeed, 0.0)) * 0.05 + 0.02;
        float dripStartOffset = random(vec2(0.0, dripSeed)) * 50.0;
        
        float dripProgress = fract(uTime * dripSpeed + dripStartOffset);
        float dripY = meltRegion - dripProgress * (1.0 - uMeltLevel) * 0.8;

        if(vUv.y < meltRegion && vUv.y > dripY && vUv.y > dripY - 0.25) {
             float dripWidth = (0.01 + random(vec2(dripSeed, 1.0)) * 0.015) * (1.0 - (dripY - vUv.y) / 0.25);
             if (abs(vUv.x - dripX) < dripWidth) {
                 finalColor *= 1.05 + random(vec2(dripSeed, 2.0)) * 0.1;
             }
        }
    }
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const flameVertexShader = `
    varying vec3 vPosition;
    varying float vNoise;
    uniform float uTime;

    // Perlin noise function
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
    }

    void main() {
        vPosition = position;
        
        float time = uTime * 2.0;
        float flicker = snoise(vec3(position.xy * 3.0, time));
        float turbulence = snoise(vec3(position.xy * 5.0, time * 0.8));
        
        vec3 displaced = position;
        
        // Tapering
        float taper = pow(1.0 - position.y, 2.0);
        displaced.x *= taper;
        displaced.z *= taper;

        // Noise displacement for a more organic shape
        displaced.x += (flicker * 0.5) * (1.0 - position.y) * 0.4;
        displaced.z += (turbulence * 0.5) * (1.0 - position.y) * 0.4;

        // Make it rise
        displaced.y *= 1.8;

        vNoise = flicker + turbulence;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
    }
`;

const flameFragmentShader = `
    varying vec3 vPosition;
    varying float vNoise;
    uniform float uTime;
    uniform vec3 uColor;

    void main() {
        float y = vPosition.y;
        
        // Base color, fades to dark at the tip
        vec3 baseColor = uColor * (1.0 - y * 0.5);
        
        // Inner core color, yellowish white
        vec3 coreColor = vec3(1.0, 1.0, 0.7);
        float coreStrength = smoothstep(0.0, 0.5, y) - smoothstep(0.5, 0.8, y);
        coreStrength = pow(coreStrength, 2.5);
        
        vec3 finalColor = mix(baseColor, coreColor, coreStrength);
        
        // Add flickering noise to the color
        finalColor += vNoise * 0.1;
        
        // Alpha fades at the edges and tip
        float alpha = (1.0 - y) * (1.0 - vNoise * 0.5);
        alpha = smoothstep(0.0, 0.2, alpha); // Sharp edge at the bottom

        gl_FragColor = vec4(finalColor, alpha);
    }
`;

export default function CandleScene({
  candleHeight,
  initialCandleHeight,
  candleWidth,
  flameColor,
  waxColor,
  baseColor,
  rulerColor,
  rulerLabelColor,
  cameraState,
  onCameraChange
}: CandleProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const { locale } = useIntl();
  const stateRef = useRef({
      renderer: null as THREE.WebGLRenderer | null,
      scene: null as THREE.Scene | null,
      camera: null as THREE.PerspectiveCamera | null,
      controls: null as OrbitControls | null,
      candle: null as Mesh | null,
      wick: null as Mesh | null,
      candleTop: null as Mesh | null,
      flameLight: null as THREE.PointLight | null,
      flameMesh: null as Mesh | null,
      ruler: null as THREE.Group | null,
      candleMaterial: null as THREE.ShaderMaterial | null,
      flameMaterial: null as THREE.ShaderMaterial | null,
  }).current;

  const createRuler = useMemo(() => (height: number, width: number, isRTL: boolean, rColor: string, rLabelColor: string) => {
    const group = new THREE.Group();
    const material = new THREE.LineBasicMaterial({ color: rColor, transparent: true, opacity: 0.5 });
    
    const lineDir = isRTL ? -1 : 1;
    const lineLength = 0.5;

    // Main vertical line
    const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, height, 0)];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    group.add(line);

    // Horizontal lines pointing towards the candle
    const topPoints = [new THREE.Vector3(0, height, 0), new THREE.Vector3(-lineLength * lineDir, height, 0)];
    const bottomPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(-lineLength * lineDir, 0, 0)];
    const topGeom = new THREE.BufferGeometry().setFromPoints(topPoints);
    const bottomGeom = new THREE.BufferGeometry().setFromPoints(bottomPoints);
    group.add(new THREE.Line(topGeom, material));
    group.add(new THREE.Line(bottomGeom, material));


    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    ctx.font = 'bold 96px "Roboto Mono", monospace';
    
    const text = height <= 0.001 ? "0.00\"" : `${height.toFixed(2)}"`;
    
    const textMetrics = ctx.measureText(text);
    canvas.width = textMetrics.width + 20;
    canvas.height = 128;
    
    ctx.font = 'bold 96px "Roboto Mono", monospace';
    ctx.fillStyle = rLabelColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    
    const spriteWidth = (textMetrics.width + 20) / 100;
    sprite.scale.set(spriteWidth, 1.28, 1);
    
    const offset = isRTL ? -0.8 - spriteWidth / 2 : 0.8 + spriteWidth / 2;
    sprite.position.set(offset, height / 2, 0);

    // Vertical translation for small heights
    let yOffset = 0;
    if (height < 2.0) {
        const t = 1 - (height / 2.0); // 0 at height=2, 1 at height=0
        yOffset = t * (32/96); // 32px is the target offset
    }
     sprite.position.y += yOffset;
    
    group.position.x = (width / 2 + 1) * (isRTL ? -1 : 1);

    group.add(sprite);

    return group;
  }, []);

  const handleCameraChange = useCallback(() => {
    if (stateRef.camera && stateRef.controls && onCameraChange) {
      onCameraChange({
        position: stateRef.camera.position.toArray(),
        quaternion: stateRef.camera.quaternion.toArray() as [number,number,number,number],
        target: stateRef.controls.target.toArray(),
        zoom: stateRef.camera.zoom
      });
    }
  }, [onCameraChange, stateRef]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    stateRef.scene = new THREE.Scene();
    stateRef.camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    
    stateRef.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    stateRef.renderer.setSize(mount.clientWidth, mount.clientHeight);
    stateRef.renderer.setPixelRatio(window.devicePixelRatio);
    stateRef.renderer.shadowMap.enabled = true;
    stateRef.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(stateRef.renderer.domElement);
    
    stateRef.controls = new OrbitControls(stateRef.camera, stateRef.renderer.domElement);
    stateRef.controls.enableDamping = true;
    stateRef.controls.addEventListener('end', handleCameraChange);

    if (cameraState) {
        stateRef.camera.position.fromArray(cameraState.position);
        stateRef.camera.quaternion.fromArray(cameraState.quaternion);
        stateRef.controls.target.fromArray(cameraState.target);
        stateRef.camera.zoom = cameraState.zoom;
        stateRef.camera.updateProjectionMatrix();
    } else {
        stateRef.camera.position.set(0, initialCandleHeight / 1.5, 18);
        stateRef.controls.target.set(0, initialCandleHeight / 2, 0);
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    stateRef.scene.add(ambientLight);

    stateRef.flameLight = new THREE.PointLight(flameColor, 25, 100);
    stateRef.flameLight.castShadow = true;
    stateRef.flameLight.shadow.mapSize.width = 1024;
    stateRef.flameLight.shadow.mapSize.height = 1024;
    stateRef.scene.add(stateRef.flameLight);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.8 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    stateRef.scene.add(floor);
    
    stateRef.candleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uWaxColor: { value: new THREE.Color(waxColor) },
        uMeltLevel: { value: 1.0 },
        uTime: { value: 0.0 },
      },
      vertexShader: candleVertexShader,
      fragmentShader: candleFragmentShader,
    });

    const candleRadius = candleWidth / 2;
    const candleGeometry = new THREE.CylinderGeometry(candleRadius, candleRadius, 1, 64, 32, true);
    candleGeometry.translate(0, 0.5, 0);
    stateRef.candle = new THREE.Mesh(candleGeometry, stateRef.candleMaterial);
    stateRef.candle.position.y = 0;
    stateRef.candle.scale.y = candleHeight;
    stateRef.candle.castShadow = true;
    stateRef.candle.receiveShadow = true;
    stateRef.scene.add(stateRef.candle);

    const candleTopGeom = new THREE.CircleGeometry(candleRadius, 64);
    candleTopGeom.rotateX(-Math.PI / 2);
    const candleTopMat = new THREE.MeshStandardMaterial({ color: waxColor });
    stateRef.candleTop = new THREE.Mesh(candleTopGeom, candleTopMat);
    stateRef.candleTop.position.y = candleHeight;
    stateRef.scene.add(stateRef.candleTop);

    const wickGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
    const wickMat = new THREE.MeshStandardMaterial({ color: 0x302010 });
    stateRef.wick = new THREE.Mesh(wickGeom, wickMat);
    stateRef.wick.position.y = candleHeight;
    stateRef.scene.add(stateRef.wick);


    stateRef.flameMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0.0 },
            uColor: { value: new THREE.Color(flameColor) }
        },
        vertexShader: flameVertexShader,
        fragmentShader: flameFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const flameGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    flameGeometry.translate(0, 0.5, 0); // Center the base of the sphere
    stateRef.flameMesh = new THREE.Mesh(flameGeometry, stateRef.flameMaterial);
    stateRef.flameMesh.scale.set(1.5, 3, 1.5);
    stateRef.scene.add(stateRef.flameMesh);

    const isRTL = locale === 'he';
    stateRef.ruler = createRuler(candleHeight, candleWidth, isRTL, rulerColor, rulerLabelColor);
    stateRef.scene.add(stateRef.ruler);

    let animationFrameId: number;
    const clock = new THREE.Clock();
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if(stateRef.candleMaterial) stateRef.candleMaterial.uniforms.uTime.value += delta;
      if(stateRef.flameMaterial) stateRef.flameMaterial.uniforms.uTime.value += delta;

      stateRef.controls?.update();
      stateRef.renderer!.render(stateRef.scene!, stateRef.camera!);
    };
    animate();

    const handleResize = () => {
      if (mount && stateRef.renderer && stateRef.camera) {
        stateRef.renderer.setSize(mount.clientWidth, mount.clientHeight);
        stateRef.camera.aspect = mount.clientWidth / mount.clientHeight;
        stateRef.camera.updateProjectionMatrix();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      stateRef.controls?.removeEventListener('end', handleCameraChange);
      stateRef.controls?.dispose();
      if (mount && stateRef.renderer) {
          mount.removeChild(stateRef.renderer.domElement);
      }
      stateRef.scene?.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material?.dispose();
          }
        }
      });
      stateRef.renderer?.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cameraState && stateRef.camera && stateRef.controls) {
      stateRef.camera.position.fromArray(cameraState.position);
      stateRef.camera.quaternion.fromArray(cameraState.quaternion);
      stateRef.controls.target.fromArray(cameraState.target);
      stateRef.camera.zoom = cameraState.zoom;
      stateRef.camera.updateProjectionMatrix();
      stateRef.controls.update();
    }
  }, [cameraState, stateRef.camera, stateRef.controls]);

  useEffect(() => {
    if (stateRef.scene && stateRef.ruler) {
      stateRef.scene.remove(stateRef.ruler);
    }
    const isRTL = locale === 'he';
    const newRuler = createRuler(candleHeight, candleWidth, isRTL, rulerColor, rulerLabelColor);
    stateRef.ruler = newRuler;
    stateRef.scene?.add(newRuler);
  }, [locale, candleHeight, candleWidth, createRuler, stateRef.scene, stateRef.ruler, rulerColor, rulerLabelColor]);

  useEffect(() => {
    if (stateRef.candle && stateRef.flameLight && stateRef.flameMesh && stateRef.candleMaterial && stateRef.ruler && stateRef.candleTop && stateRef.wick) {
      const totalCandleY = candleHeight;
      
      stateRef.candle.scale.y = candleHeight;
      stateRef.candle.position.y = 0;

      const wickTop = totalCandleY + 0.25;
      const flamePosition = wickTop + 0.1;
      stateRef.flameLight.position.y = flamePosition;
      stateRef.flameMesh.position.y = flamePosition;
      stateRef.candleTop.position.y = totalCandleY;
      stateRef.wick.position.y = totalCandleY;

      const meltLevel = candleHeight / initialCandleHeight;
      stateRef.candleMaterial.uniforms.uMeltLevel.value = meltLevel;

      if (stateRef.scene) {
        stateRef.scene.remove(stateRef.ruler);
        const isRTL = locale === 'he';
        const newRuler = createRuler(candleHeight, candleWidth, isRTL, rulerColor, rulerLabelColor);
        stateRef.ruler = newRuler;
        stateRef.scene.add(newRuler);
      }
    }
  }, [candleHeight, initialCandleHeight, candleWidth, locale, createRuler, stateRef, rulerColor, rulerLabelColor]);

  useEffect(() => {
    if (stateRef.flameLight && stateRef.flameMaterial) {
        const color = new THREE.Color(flameColor);
        stateRef.flameLight.color = color;
        stateRef.flameMaterial.uniforms.uColor.value = color;
    }
  }, [flameColor, stateRef.flameLight, stateRef.flameMaterial]);

  useEffect(() => {
    if(stateRef.candleMaterial && stateRef.candleTop) {
        const color = new THREE.Color(waxColor);
        stateRef.candleMaterial.uniforms.uWaxColor.value = color;
        (stateRef.candleTop.material as THREE.MeshStandardMaterial).color = color;
    }
  }, [waxColor, stateRef.candleMaterial, stateRef.candleTop]);

   useEffect(() => {
    if (stateRef.candle && stateRef.candleTop) {
      const candleRadius = candleWidth / 2;
      const newGeometry = new THREE.CylinderGeometry(candleRadius, candleRadius, 1, 64, 32, true);
      newGeometry.translate(0, 0.5, 0);
      stateRef.candle.geometry.dispose();
      stateRef.candle.geometry = newGeometry;
      
      const newTopGeom = new THREE.CircleGeometry(candleRadius, 64);
      newTopGeom.rotateX(-Math.PI / 2);
      stateRef.candleTop.geometry.dispose();
      stateRef.candleTop.geometry = newTopGeom;
    }
   }, [candleWidth, stateRef.candle, stateRef.candleTop]);


  return <div ref={mountRef} className="w-full h-full" />;
}
