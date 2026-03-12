import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import Footer from "./Footer";

// ─── Neural Network Math (XOR) ────────────────────────────────────────────────

function sigmoid(x) {
  return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
}
function sigmoidDeriv(x) {
  return x * (1 - x);
}

function createNetwork() {
  const r = () => Math.random() * 2 - 1;
  return {
    w1: Array.from({ length: 2 }, () => Array.from({ length: 4 }, r)),
    b1: Array.from({ length: 4 }, r),
    w2: Array.from({ length: 4 }, () => Array.from({ length: 4 }, r)),
    b2: Array.from({ length: 4 }, r),
    w3: Array.from({ length: 4 }, () => [r()]),
    b3: [r()],
  };
}

function forwardPass(net, input) {
  const h1 = net.b1.map((b, j) => {
    let s = b;
    for (let i = 0; i < input.length; i++) s += input[i] * net.w1[i][j];
    return sigmoid(s);
  });
  const h2 = net.b2.map((b, j) => {
    let s = b;
    for (let i = 0; i < h1.length; i++) s += h1[i] * net.w2[i][j];
    return sigmoid(s);
  });
  let out = net.b3[0];
  for (let i = 0; i < h2.length; i++) out += h2[i] * net.w3[i][0];
  out = sigmoid(out);
  return { h1, h2, output: out };
}

function trainStep(net, lr = 0.5) {
  const data = [
    { input: [0, 0], target: 0 },
    { input: [0, 1], target: 1 },
    { input: [1, 0], target: 1 },
    { input: [1, 1], target: 0 },
  ];
  let totalLoss = 0, correct = 0;
  for (const s of data) {
    const { h1, h2, output } = forwardPass(net, s.input);
    const err = s.target - output;
    totalLoss += err * err;
    if (Math.round(output) === s.target) correct++;
    const dO = err * sigmoidDeriv(output);
    const dH2 = h2.map((v, j) => dO * net.w3[j][0] * sigmoidDeriv(v));
    const dH1 = h1.map((v, i) => {
      let sum = 0;
      for (let j = 0; j < 4; j++) sum += dH2[j] * net.w2[i][j];
      return sum * sigmoidDeriv(v);
    });
    for (let j = 0; j < 4; j++) net.w3[j][0] += lr * dO * h2[j];
    net.b3[0] += lr * dO;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) net.w2[i][j] += lr * dH2[j] * h1[i];
      net.b2[i] += lr * dH2[i];
    }
    for (let i = 0; i < 2; i++)
      for (let j = 0; j < 4; j++) net.w1[i][j] += lr * dH1[j] * s.input[i];
    for (let j = 0; j < 4; j++) net.b1[j] += lr * dH1[j];
  }
  return { loss: totalLoss / data.length, accuracy: (correct / data.length) * 100 };
}

// ─── Training Steps Definition ────────────────────────────────────────────────

const TRAINING_STEPS = [
  {
    id: "input",
    title: "Step 1: Feed Input",
    description: "We feed the XOR input [1, 0] into the network. Each input neuron holds one value. The expected output is 1 (since 1 XOR 0 = 1).",
    activeLayerPair: null,
    direction: "forward",
    activeLayers: [0],
    color: "cyan",
  },
  {
    id: "fwd-1",
    title: "Step 2: Input to Hidden Layer 1",
    description: "Each input is multiplied by a weight and sent to Hidden Layer 1. Each hidden neuron sums all weighted inputs, adds a bias, then applies the sigmoid function: output = 1/(1+e^(-x)). This squashes the result between 0 and 1.",
    activeLayerPair: 0,
    direction: "forward",
    activeLayers: [0, 1],
    color: "blue",
  },
  {
    id: "fwd-2",
    title: "Step 3: Hidden Layer 1 to Hidden Layer 2",
    description: "Hidden Layer 1 outputs are now the inputs for Hidden Layer 2. Same process: multiply by weights, sum, add bias, apply sigmoid. Two hidden layers let the network learn non-linear patterns like XOR that a single layer cannot solve.",
    activeLayerPair: 1,
    direction: "forward",
    activeLayers: [0, 1, 2],
    color: "blue",
  },
  {
    id: "fwd-3",
    title: "Step 4: Hidden Layer 2 to Output",
    description: "Hidden Layer 2 sends its values to the single output neuron. After applying sigmoid, we get the network's prediction — a number between 0 and 1. This is the FORWARD PASS complete.",
    activeLayerPair: 2,
    direction: "forward",
    activeLayers: [0, 1, 2, 3],
    color: "blue",
  },
  {
    id: "loss",
    title: "Step 5: Calculate Loss (Error)",
    description: "We compare the prediction to the target. Loss = (target - prediction)^2. A high loss means the network is far off. The goal of training is to minimize this loss to zero.",
    activeLayerPair: null,
    direction: "forward",
    activeLayers: [3],
    color: "red",
  },
  {
    id: "bp-1",
    title: "Step 6: Backprop — Output to Hidden 2",
    description: "Now we go BACKWARD. We calculate how much the output neuron's error was caused by each Hidden Layer 2 neuron. This is the gradient — it tells us which direction to adjust each weight to reduce the loss.",
    activeLayerPair: 2,
    direction: "backward",
    activeLayers: [3, 2],
    color: "orange",
  },
  {
    id: "bp-2",
    title: "Step 7: Backprop — Hidden 2 to Hidden 1",
    description: "The error signal continues backward. Each Hidden Layer 1 neuron learns how much it contributed to the error. The chain rule of calculus links each weight to the final loss.",
    activeLayerPair: 1,
    direction: "backward",
    activeLayers: [3, 2, 1],
    color: "orange",
  },
  {
    id: "bp-3",
    title: "Step 8: Backprop — Hidden 1 to Input",
    description: "The gradients reach the first set of weights (input to hidden 1). Now every weight in the entire network knows how much it needs to change. This is BACKPROPAGATION complete.",
    activeLayerPair: 0,
    direction: "backward",
    activeLayers: [3, 2, 1, 0],
    color: "orange",
  },
  {
    id: "update",
    title: "Step 9: Update Weights (Gradient Descent)",
    description: "All weights are adjusted: new_weight = old_weight + learning_rate x gradient. This nudges every connection slightly to reduce the loss. After many epochs of this cycle, the network learns the correct XOR pattern.",
    activeLayerPair: null,
    direction: "forward",
    activeLayers: [0, 1, 2, 3],
    color: "green",
  },
];

// ─── Layout ────────────────────────────────────────────────────────────────────

const LAYERS = [
  [[-4.5, 1.2, 0], [-4.5, -1.2, 0]],
  [[-1.5, 2.7, 0], [-1.5, 0.9, 0], [-1.5, -0.9, 0], [-1.5, -2.7, 0]],
  [[1.5, 2.7, 0], [1.5, 0.9, 0], [1.5, -0.9, 0], [1.5, -2.7, 0]],
  [[4.5, 0, 0]],
];

// ─── Deep Space Environment ──────────────────────────────────────────────────

// Layer 1: Distant stars — tiny, many, barely moving
function DistantStars() {
  const ref = useRef();
  const count = 600;
  const { positions, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Spread far out in a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 20 + Math.random() * 30;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi) - 10;
      sz[i] = 0.02 + Math.random() * 0.04;
    }
    return { positions: pos, sizes: sz };
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.003;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#aabbdd" size={0.03} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

// Layer 2: Mid-field stars — slightly larger, colored, gentle twinkle
function MidStars() {
  const ref = useRef();
  const count = 200;
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const starColors = [
      [0.7, 0.8, 1.0],   // blue-white
      [1.0, 0.9, 0.7],   // warm yellow
      [0.6, 0.7, 1.0],   // cool blue
      [1.0, 0.7, 0.5],   // orange
      [0.8, 0.85, 1.0],  // pale blue
    ];
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 2] = -5 - Math.random() * 20;
      const c = starColors[Math.floor(Math.random() * starColors.length)];
      col[i * 3] = c[0];
      col[i * 3 + 1] = c[1];
      col[i * 3 + 2] = c[2];
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.006;
      ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.003) * 0.02;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} transparent opacity={0.7} sizeAttenuation vertexColors />
    </points>
  );
}

// Layer 3: Nebula clouds — soft glowing translucent spheres far behind
function NebulaClouds() {
  const groupRef = useRef();

  const clouds = useMemo(() => {
    return [
      { pos: [-12, 5, -18], scale: 6, color: "#1a0a3e", opacity: 0.06 },
      { pos: [10, -4, -22], scale: 8, color: "#0a1a3e", opacity: 0.05 },
      { pos: [-6, -7, -16], scale: 5, color: "#2a0a2e", opacity: 0.04 },
      { pos: [14, 6, -25], scale: 9, color: "#0a1a2e", opacity: 0.05 },
      { pos: [0, 3, -20], scale: 7, color: "#1a0a2e", opacity: 0.04 },
      { pos: [-15, -2, -24], scale: 10, color: "#0a0a3e", opacity: 0.03 },
      { pos: [8, 8, -19], scale: 5, color: "#2a1a3e", opacity: 0.05 },
    ];
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.002) * 0.03;
      groupRef.current.position.x = Math.sin(clock.elapsedTime * 0.004) * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {clouds.map((c, i) => (
        <mesh key={i} position={c.pos}>
          <sphereGeometry args={[c.scale, 16, 16]} />
          <meshBasicMaterial color={c.color} transparent opacity={c.opacity} side={THREE.BackSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// Layer 4: Cosmic dust — tiny drifting particles near the network
function CosmicDust() {
  const ref = useRef();
  const count = 80;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.z = clock.elapsedTime * 0.008;
      ref.current.rotation.y = clock.elapsedTime * 0.005;
      // Gentle drift
      const arr = ref.current.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        arr[i * 3 + 1] += Math.sin(clock.elapsedTime * 0.3 + i) * 0.0003;
      }
      ref.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#4466aa" size={0.025} transparent opacity={0.25} sizeAttenuation />
    </points>
  );
}

// ─── Neuron ─────────────────────────────────────────────────────────────────────

function Neuron({ position, activation, layerIdx, neuronIdx, isSelected, onClick, onHover, isActive }) {
  const groupRef = useRef();
  const coreRef = useRef();
  const pulseRef = useRef();
  const baseY = position[1];
  const clickPulse = useRef(0);

  const handleClick = (e) => {
    e.stopPropagation();
    clickPulse.current = 1.0;
    onClick();
  };

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.position.y = baseY + Math.sin(t * 0.4 + neuronIdx * 1.2 + layerIdx * 2) * 0.08;
      groupRef.current.position.z = Math.cos(t * 0.3 + neuronIdx * 0.7) * 0.04;
    }

    if (coreRef.current) {
      const targetScale = isActive ? 0.25 + activation * 0.15 : 0.18 + activation * 0.1;
      coreRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.06);
      const glow = isActive ? 1.2 + Math.sin(t * 2.5) * 0.3 : 0.4 + activation * 0.6;
      coreRef.current.material.emissiveIntensity = isSelected ? 2.0 : glow;
    }

    if (pulseRef.current) {
      if (clickPulse.current > 0.01) {
        clickPulse.current *= 0.93;
        pulseRef.current.scale.set(1 + (1 - clickPulse.current) * 3, 1 + (1 - clickPulse.current) * 3, 1);
        pulseRef.current.material.opacity = clickPulse.current * 0.5;
        pulseRef.current.visible = true;
      } else {
        pulseRef.current.visible = false;
      }
    }
  });

  const hue = layerIdx === 0 ? 0.55 : layerIdx === 3 ? 0.8 : 0.65 + activation * 0.1;
  const dimFactor = isActive ? 1 : 0.35;
  const color = new THREE.Color().setHSL(hue, 0.85 * dimFactor, (0.35 + activation * 0.35) * dimFactor);
  const selectedColor = new THREE.Color("#ffcc00");

  return (
    <group ref={groupRef} position={[position[0], position[1], position[2]]}>
      <mesh
        ref={coreRef}
        onClick={handleClick}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; onHover(true); }}
        onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = "auto"; onHover(false); }}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={isSelected ? selectedColor : color}
          emissive={isSelected ? selectedColor : color}
          emissiveIntensity={1}
          roughness={0.15}
          metalness={0.4}
          transparent
          opacity={isActive ? 0.95 : 0.3}
        />
      </mesh>

      {/* Outer glow */}
      {isActive && (
        <>
          <mesh scale={[0.45 + activation * 0.25, 0.45 + activation * 0.25, 0.45 + activation * 0.25]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color={isSelected ? "#ffcc00" : color} transparent opacity={0.08 + activation * 0.1} side={THREE.BackSide} />
          </mesh>
          <mesh scale={[0.6 + activation * 0.3, 0.6 + activation * 0.3, 0.6 + activation * 0.3]}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshBasicMaterial color={isSelected ? "#ffcc00" : color} transparent opacity={0.03 + activation * 0.04} side={THREE.BackSide} />
          </mesh>
        </>
      )}

      {/* Click shockwave */}
      <mesh ref={pulseRef} rotation={[Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.3, 0.35, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ─── Data particle ────────────────────────────────────────────────────────────

function DataParticle({ startPos, endPos, duration, delay, isBackward, weight }) {
  const ref = useRef();
  const trailRef = useRef();
  const elapsed = useRef(0);

  const absWeight = Math.min(Math.abs(weight), 2);
  const size = 0.06 + absWeight * 0.03;

  useFrame((_, delta) => {
    elapsed.current += delta;
    if (elapsed.current < delay) { if (ref.current) ref.current.visible = false; return; }

    const progress = Math.min((elapsed.current - delay) / duration, 1);
    if (ref.current) {
      const t = isBackward ? 1 - progress : progress;
      ref.current.position.x = startPos[0] + (endPos[0] - startPos[0]) * t;
      ref.current.position.y = startPos[1] + (endPos[1] - startPos[1]) * t;
      ref.current.position.z = startPos[2] + (endPos[2] - startPos[2]) * t + Math.sin(progress * Math.PI) * 0.25;
      ref.current.visible = progress < 1;
      const pulse = 1 + Math.sin(progress * Math.PI) * 0.5;
      ref.current.scale.setScalar(pulse);
    }
    // Small trailing glow
    if (trailRef.current) {
      const t = isBackward ? 1 - Math.max(0, progress - 0.05) : Math.max(0, progress - 0.05);
      trailRef.current.position.x = startPos[0] + (endPos[0] - startPos[0]) * t;
      trailRef.current.position.y = startPos[1] + (endPos[1] - startPos[1]) * t;
      trailRef.current.position.z = startPos[2] + (endPos[2] - startPos[2]) * t + Math.sin(Math.max(0, progress - 0.05) * Math.PI) * 0.25;
      trailRef.current.visible = progress > 0.05 && progress < 1;
    }
  });

  const color = isBackward ? "#ff7700" : "#00bbff";

  return (
    <>
      <mesh ref={ref} visible={false}>
        <sphereGeometry args={[size, 10, 10]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} />
      </mesh>
      <mesh ref={trailRef} visible={false}>
        <sphereGeometry args={[size * 0.6, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
    </>
  );
}

// ─── Connection ────────────────────────────────────────────────────────────────

function Connection({ start, end, weight, isHighlighted, isActive }) {
  const lineRef = useRef();
  const absW = Math.min(Math.abs(weight), 2);

  useFrame(({ clock }) => {
    if (lineRef.current && isHighlighted) {
      lineRef.current.material.opacity = 0.5 + Math.sin(clock.elapsedTime * 3) * 0.3;
    }
  });

  const color = useMemo(() => {
    if (isHighlighted) return new THREE.Color("#ffcc00");
    if (!isActive) return new THREE.Color(0.12, 0.12, 0.18);
    if (weight >= 0) return new THREE.Color().setHSL(0.55, 0.8, 0.3 + absW * 0.25);
    return new THREE.Color().setHSL(0.0, 0.7, 0.3 + absW * 0.2);
  }, [weight, isHighlighted, isActive, absW]);

  const points = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const mid = new THREE.Vector3().addVectors(s, e).multiplyScalar(0.5);
    mid.z += 0.1;
    return new THREE.QuadraticBezierCurve3(s, mid, e).getPoints(20);
  }, [start, end]);

  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={isHighlighted ? 0.8 : isActive ? 0.06 + absW * 0.14 : 0.03} linewidth={1} />
    </line>
  );
}

// ─── 3D Scene ─────────────────────────────────────────────────────────────────

function NeuralNetworkScene({ network, activations, selectedNeuron, onSelectNeuron, step, particleKey, training }) {
  const [hoveredNeuron, setHoveredNeuron] = useState(null);
  const sceneRef = useRef();

  // Slow gentle scene drift
  useFrame(({ clock }) => {
    if (sceneRef.current) {
      sceneRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.04) * 0.02;
      sceneRef.current.position.y = Math.sin(clock.elapsedTime * 0.06) * 0.08;
    }
  });

  const currentStep = step !== null ? TRAINING_STEPS[step] : null;
  const activeLayers = currentStep ? new Set(currentStep.activeLayers) : new Set([0, 1, 2, 3]);

  const getActivation = (l, n) => {
    if (!activations) return 0.3;
    if (l === 0) return 0.5;
    if (l === 1) return activations.h1?.[n] ?? 0.3;
    if (l === 2) return activations.h2?.[n] ?? 0.3;
    if (l === 3) return activations.output ?? 0.3;
    return 0.3;
  };

  const connections = useMemo(() => {
    const conns = [];
    for (let l = 0; l < LAYERS.length - 1; l++) {
      for (let i = 0; i < LAYERS[l].length; i++) {
        for (let j = 0; j < LAYERS[l + 1].length; j++) {
          let w = 0.5;
          if (network) {
            if (l === 0) w = network.w1[i]?.[j] ?? 0;
            else if (l === 1) w = network.w2[i]?.[j] ?? 0;
            else if (l === 2) w = network.w3[i]?.[0] ?? 0;
          }
          const isHL = selectedNeuron &&
            ((selectedNeuron.layer === l && selectedNeuron.idx === i) ||
              (selectedNeuron.layer === l + 1 && selectedNeuron.idx === j));
          const isActiveConn = currentStep?.activeLayerPair === l;

          conns.push({
            key: `c-${l}-${i}-${j}`,
            start: LAYERS[l][i],
            end: LAYERS[l + 1][j],
            weight: w,
            isHighlighted: !!isHL || isActiveConn,
            isActive: !training || activeLayers.has(l) || activeLayers.has(l + 1),
            layerIdx: l,
          });
        }
      }
    }
    return conns;
  }, [network, selectedNeuron, currentStep, training, activeLayers]);

  const particles = useMemo(() => {
    if (!currentStep || currentStep.activeLayerPair === null) return [];
    const ps = [];
    const activeConns = connections.filter((c) => c.layerIdx === currentStep.activeLayerPair);
    const isBackward = currentStep.direction === "backward";
    for (const c of activeConns) {
      const n = Math.abs(c.weight) > 0.5 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        ps.push({
          key: `p-${particleKey}-${c.key}-${k}`,
          start: c.start,
          end: c.end,
          delay: k * 0.2 + Math.random() * 0.15,
          duration: 1.5,
          weight: c.weight,
          isBackward,
        });
      }
    }
    return ps;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connections, currentStep, particleKey]);

  const layerLabels = [
    { pos: [-4.5, 3.5, 0], label: "INPUT", sub: "2 neurons", idx: 0 },
    { pos: [-1.5, 4.2, 0], label: "HIDDEN 1", sub: "4 neurons", idx: 1 },
    { pos: [1.5, 4.2, 0], label: "HIDDEN 2", sub: "4 neurons", idx: 2 },
    { pos: [4.5, 2.2, 0], label: "OUTPUT", sub: "1 neuron", idx: 3 },
  ];

  return (
    <>
      {/* Deep space lighting */}
      <ambientLight intensity={0.08} />
      <pointLight position={[0, 8, 8]} intensity={0.8} color="#4466cc" />
      <pointLight position={[-8, -4, 5]} intensity={0.4} color="#6633aa" />
      <pointLight position={[8, -4, 5]} intensity={0.3} color="#2255cc" />
      <pointLight position={[0, 0, -10]} intensity={0.2} color="#112244" />

      {/* Space environment */}
      <DistantStars />
      <MidStars />
      <NebulaClouds />
      <CosmicDust />

      {/* Network floats gently */}
      <group ref={sceneRef}>
        {connections.map((c) => (
          <Connection key={c.key} start={c.start} end={c.end} weight={c.weight} isHighlighted={c.isHighlighted} isActive={c.isActive} />
        ))}

        {particles.map((p) => (
          <DataParticle key={p.key} startPos={p.start} endPos={p.end} duration={p.duration} delay={p.delay} isBackward={p.isBackward} weight={p.weight} />
        ))}

        {LAYERS.map((layer, li) =>
          layer.map((pos, ni) => {
            const isSel = selectedNeuron?.layer === li && selectedNeuron?.idx === ni;
            return (
              <Neuron
                key={`n-${li}-${ni}`}
                position={pos}
                activation={getActivation(li, ni)}
                layerIdx={li}
                neuronIdx={ni}
                isSelected={isSel}
                isActive={!training || activeLayers.has(li)}
                onClick={() => onSelectNeuron(isSel ? null : { layer: li, idx: ni })}
                onHover={(h) => setHoveredNeuron(h ? { layer: li, idx: ni } : null)}
              />
            );
          })
        )}

        {/* Tooltip */}
        {hoveredNeuron && (
          <Html position={LAYERS[hoveredNeuron.layer][hoveredNeuron.idx]} center style={{ pointerEvents: "none" }}>
            <div className="bg-black/90 backdrop-blur border border-cyan-800/50 rounded-lg px-3 py-2 text-xs whitespace-nowrap -mt-14 shadow-lg shadow-cyan-900/30">
              <div className="text-cyan-400 font-semibold text-[11px]">
                {["Input", "Hidden 1", "Hidden 2", "Output"][hoveredNeuron.layer]} [{hoveredNeuron.idx}]
              </div>
              <div className="text-gray-300 font-mono">
                act: {getActivation(hoveredNeuron.layer, hoveredNeuron.idx).toFixed(4)}
              </div>
            </div>
          </Html>
        )}

        {/* Layer labels */}
        {layerLabels.map((l) => {
          const isLayerActive = !training || activeLayers.has(l.idx);
          const direction = currentStep?.direction;
          return (
            <Html key={l.label} position={l.pos} center style={{ pointerEvents: "none" }}>
              <div className="text-center">
                <div className={`text-[11px] font-mono font-bold tracking-widest transition-all duration-500 ${
                  !training ? "text-cyan-500/60"
                  : isLayerActive
                    ? direction === "backward" ? "text-orange-400 drop-shadow-lg" : "text-cyan-300 drop-shadow-lg"
                    : "text-gray-700"
                }`}>{l.label}</div>
                <div className={`text-[8px] font-mono transition-all duration-500 ${
                  !training || isLayerActive ? "text-gray-500" : "text-gray-800"
                }`}>{l.sub}</div>
              </div>
            </Html>
          );
        })}
      </group>

      <OrbitControls enablePan enableZoom enableRotate maxDistance={18} minDistance={4} />
    </>
  );
}

// ─── Step Explanation Card ────────────────────────────────────────────────────

function StepCard({ step, epoch, loss, accuracy, paused, onPause }) {
  const s = TRAINING_STEPS[step];
  const colorMap = {
    cyan: { border: "border-cyan-500/40", bg: "bg-cyan-950/80", text: "text-cyan-300", badge: "bg-cyan-500/20 text-cyan-400" },
    blue: { border: "border-blue-500/40", bg: "bg-blue-950/80", text: "text-blue-300", badge: "bg-blue-500/20 text-blue-400" },
    orange: { border: "border-orange-500/40", bg: "bg-orange-950/80", text: "text-orange-300", badge: "bg-orange-500/20 text-orange-400" },
    red: { border: "border-red-500/40", bg: "bg-red-950/80", text: "text-red-300", badge: "bg-red-500/20 text-red-400" },
    green: { border: "border-green-500/40", bg: "bg-green-950/80", text: "text-green-300", badge: "bg-green-500/20 text-green-400" },
  };
  const c = colorMap[s.color];

  return (
    <motion.div
      key={`step-${step}-${epoch}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`absolute bottom-4 left-4 right-4 ${c.border} ${c.bg} backdrop-blur-md border rounded-xl p-4 shadow-2xl`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
              EPOCH {epoch + 1}
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
              {step + 1} / {TRAINING_STEPS.length}
            </span>
            {loss !== null && (
              <span className="text-[10px] font-mono text-gray-500">
                Loss: {loss.toFixed(4)} | Acc: {accuracy}%
              </span>
            )}
            {paused && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 animate-pulse">
                PAUSED
              </span>
            )}
          </div>
          <h3 className={`text-sm font-bold ${c.text} mb-1`}>{s.title}</h3>
          <p className="text-xs text-gray-300 leading-relaxed">{s.description}</p>
        </div>

        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          {/* Pause/Resume button inside card */}
          <button
            onClick={onPause}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
              paused
                ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30"
                : "bg-yellow-500/15 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/25"
            }`}
          >
            {paused ? "Resume" : "Pause"}
          </button>

          {/* Progress dots */}
          <div className="flex flex-col gap-0.5">
            {TRAINING_STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? "bg-white scale-125" : i < step ? "bg-gray-500" : "bg-gray-800"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function NeuralNetworkLabPage() {
  const [network, setNetwork] = useState(() => createNetwork());
  const [activations, setActivations] = useState(null);
  const [selectedNeuron, setSelectedNeuron] = useState(null);
  const [training, setTraining] = useState(false);
  const [paused, setPaused] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [loss, setLoss] = useState(null);
  const [accuracy, setAccuracy] = useState(0);
  const [currentStep, setCurrentStep] = useState(null);
  const [particleKey, setParticleKey] = useState(0);

  const trainingRef = useRef(false);
  const pausedRef = useRef(false);
  const networkRef = useRef(network);

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const STEP_DURATION = 2800;

  const startTraining = useCallback(() => {
    if (trainingRef.current) return;
    trainingRef.current = true;
    setTraining(true);
    setPaused(false);
    pausedRef.current = false;

    const runEpoch = (epochNum) => {
      if (!trainingRef.current) return;

      const net = networkRef.current;
      const act = forwardPass(net, [1, 0]);
      setActivations(act);

      let stepIdx = 0;

      const runStep = () => {
        if (!trainingRef.current) return;

        // If paused, keep checking until resumed
        if (pausedRef.current) {
          setTimeout(runStep, 100);
          return;
        }

        if (stepIdx >= TRAINING_STEPS.length) {
          const metrics = trainStep(net, 0.5);
          setNetwork({ ...net });
          networkRef.current = net;
          setLoss(metrics.loss);
          setAccuracy(metrics.accuracy);

          const newAct = forwardPass(net, [1, 0]);
          setActivations(newAct);

          setEpoch(epochNum + 1);
          setCurrentStep(null);

          setTimeout(() => {
            if (trainingRef.current) {
              // Check pause again before starting next epoch
              const waitForResume = () => {
                if (!trainingRef.current) return;
                if (pausedRef.current) { setTimeout(waitForResume, 100); return; }
                runEpoch(epochNum + 1);
              };
              waitForResume();
            }
          }, 1200);
          return;
        }

        setCurrentStep(stepIdx);
        setParticleKey((k) => k + 1);
        stepIdx++;
        setTimeout(runStep, STEP_DURATION);
      };

      runStep();
    };

    runEpoch(0);
  }, [STEP_DURATION]);

  const togglePause = useCallback(() => {
    setPaused((p) => !p);
  }, []);

  const resetNetwork = useCallback(() => {
    trainingRef.current = false;
    pausedRef.current = false;
    setTraining(false);
    setPaused(false);
    const n = createNetwork();
    setNetwork(n);
    networkRef.current = n;
    setActivations(null);
    setSelectedNeuron(null);
    setEpoch(0);
    setLoss(null);
    setAccuracy(0);
    setCurrentStep(null);
  }, []);

  const xorResults = useMemo(() => {
    if (!network) return [];
    return [
      { input: [0, 0], target: 0 },
      { input: [0, 1], target: 1 },
      { input: [1, 0], target: 1 },
      { input: [1, 1], target: 0 },
    ].map((d) => {
      const { output } = forwardPass(network, d.input);
      return { ...d, predicted: output, correct: Math.round(output) === d.target };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network, epoch]);

  return (
    <div className="w-full min-h-screen bg-[#040608] text-gray-100 px-2 sm:px-3 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center py-5 border-b border-gray-800/30">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">AI Vision Lab</h1>
          <p className="text-gray-600 text-sm">Interactive AI Learning Platform</p>
        </div>
        <div className="text-lg font-semibold text-cyan-400/80 tracking-[0.2em] font-mono">
          NEURAL NETWORK TRAINING LAB
        </div>
        <Link to="/" className="px-3 py-2 rounded-md border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 text-sm">
          Home
        </Link>
      </header>

      <main className="grid grid-cols-12 gap-4 mt-4 flex-1 pb-4">
        {/* Left Sidebar */}
        <aside className="col-span-2 space-y-4">
          <nav className="space-y-1 text-sm">
            {[
              { path: "/features/object-detection", label: "Object Detection" },
              { path: "/features/facial-recognition", label: "Facial Recognition" },
              { path: "/features/gesture-control", label: "Gesture Control" },
              { path: "/features/image-segmentation", label: "Image Segmentation" },
              { path: "/features/monte-carlo", label: "Monte Carlo Sim" },
              { path: "/features/student-performance-predictor", label: "Student Predictor" },
              { path: "/features/neural-network-training-lab", label: "Neural Network Lab" },
            ].map((item) => (
              <Link key={item.path} to={item.path}
                className={`block px-3 py-2 rounded-md ${isActive(item.path) ? "bg-cyan-900/30 text-cyan-400 font-medium border border-cyan-800/30" : "text-gray-400 hover:bg-gray-800/50 hover:text-white"}`}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Controls */}
          <div className="p-4 rounded-lg border border-gray-800/40 bg-[#080c14] space-y-3">
            <button onClick={training ? togglePause : startTraining}
              className={`w-full py-3 rounded-lg text-sm font-bold transition-all ${
                training && !paused
                  ? "bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/25"
                  : "bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30"
              }`}>
              {!training ? "Start Training" : paused ? "Resume" : "Pause"}
            </button>

            <button onClick={resetNetwork}
              className="w-full py-3 rounded-lg text-sm font-bold bg-gray-800/50 border border-gray-700/40 text-gray-400 hover:bg-gray-700/50 hover:text-gray-200 transition">
              Reset Network
            </button>
          </div>

          {/* XOR Truth Table */}
          <div className="p-4 rounded-lg border border-gray-800/40 bg-[#080c14]">
            <h3 className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-2">XOR Predictions</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-600">
                  <th className="py-1 text-left font-medium">Input</th>
                  <th className="py-1 text-center font-medium">Target</th>
                  <th className="py-1 text-center font-medium">Output</th>
                  <th className="py-1 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {xorResults.map((r, i) => (
                  <tr key={i} className="border-t border-gray-800/30">
                    <td className="py-2 text-gray-400 font-mono">[{r.input.join(",")}]</td>
                    <td className="py-2 text-center text-gray-500 font-mono">{r.target}</td>
                    <td className={`py-2 text-center font-mono font-bold ${r.correct ? "text-cyan-400" : "text-gray-600"}`}>
                      {r.predicted.toFixed(4)}
                    </td>
                    <td className="py-2 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.correct ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/15 text-red-400 border border-red-500/20"
                      }`}>
                        {r.correct ? "PASS" : "FAIL"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </aside>

        {/* 3D Canvas */}
        <section className="col-span-7 rounded-xl border border-gray-800/20 bg-[#020304] shadow-2xl overflow-hidden relative" style={{ minHeight: "580px" }}>
          <Canvas camera={{ position: [0, 0, 10], fov: 45 }} gl={{ antialias: true, alpha: false }}>
            <color attach="background" args={["#020304"]} />
            <fog attach="fog" args={["#020304", 15, 45]} />
            <NeuralNetworkScene
              network={network}
              activations={activations}
              selectedNeuron={selectedNeuron}
              onSelectNeuron={setSelectedNeuron}
              step={currentStep}
              particleKey={particleKey}
              training={training}
            />
          </Canvas>

          {/* Legend */}
          <div className="absolute top-3 left-3 flex gap-4 text-[10px] text-gray-600 font-mono">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500/70" /> Forward</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500/70" /> Backprop</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400/70" /> +weight</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-400/70" /> -weight</span>
          </div>

          {/* Idle overlay */}
          {!training && epoch === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.5 }} className="text-center">
                <div className="text-3xl text-gray-600/80 font-mono mb-3 tracking-wider">Neural Network</div>
                <div className="text-sm text-gray-700">Drag to rotate / Scroll to zoom / Click neurons to inspect</div>
                <div className="text-sm text-cyan-600/50 mt-3 font-mono">Press Start Training to begin</div>
              </motion.div>
            </div>
          )}

          {/* Step explanation card with pause button */}
          <AnimatePresence mode="wait">
            {currentStep !== null && (
              <StepCard step={currentStep} epoch={epoch} loss={loss} accuracy={accuracy} paused={paused} onPause={togglePause} />
            )}
          </AnimatePresence>

          {/* Between-epochs card */}
          <AnimatePresence>
            {training && currentStep === null && epoch > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-4 left-4 right-4 bg-green-950/70 backdrop-blur-md border border-green-500/25 rounded-xl p-4 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-green-300">Epoch {epoch} Complete</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Loss: <span className={loss < 0.05 ? "text-green-400" : loss < 0.2 ? "text-yellow-400" : "text-red-400"}>{loss?.toFixed(6)}</span>
                      {" | "}Accuracy: <span className={accuracy === 100 ? "text-green-400" : "text-yellow-400"}>{accuracy}%</span>
                      {accuracy === 100 && <span className="ml-2 text-green-400 font-bold">SOLVED!</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={togglePause}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                        paused
                          ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"
                          : "bg-yellow-500/15 border-yellow-500/30 text-yellow-400"
                      }`}>
                      {paused ? "Resume" : "Pause"}
                    </button>
                    <span className="text-xs text-gray-600 font-mono">{paused ? "Paused" : "Next epoch..."}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Right Panel */}
        <aside className="col-span-3 space-y-4">
          {/* What is this? */}
          <div className="p-4 rounded-lg border border-gray-800/40 bg-[#080c14]">
            <h3 className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-3">What You're Watching</h3>
            <div className="space-y-3 text-xs text-gray-400 leading-relaxed">
              <p>A <span className="text-cyan-400 font-semibold">real neural network</span> learning to solve XOR in your browser. Every calculation is real.</p>
              <p>Press <span className="text-cyan-400 font-semibold">Pause</span> at any step to stop and read the explanation. Press <span className="text-cyan-400 font-semibold">Resume</span> to continue.</p>
            </div>
          </div>

          {/* 9-step checklist */}
          <div className="p-4 rounded-lg border border-gray-800/40 bg-[#080c14] overflow-y-auto" style={{ maxHeight: "420px" }}>
            <h3 className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-3">The 9-Step Training Cycle</h3>
            <div className="space-y-1.5">
              {TRAINING_STEPS.map((s, i) => {
                const isCurrent = currentStep === i;
                const isPast = currentStep !== null && i < currentStep;
                return (
                  <div key={s.id} className={`text-xs p-2 rounded-lg border transition-all duration-500 ${
                    isCurrent
                      ? "border-cyan-500/40 bg-cyan-950/30 text-white"
                      : isPast
                        ? "border-gray-800/20 bg-gray-900/20 text-gray-500"
                        : "border-transparent text-gray-700"
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                        isCurrent
                          ? "bg-cyan-500/30 text-cyan-300"
                          : isPast
                            ? "bg-gray-700/50 text-gray-500"
                            : "bg-gray-800/30 text-gray-700"
                      }`}>{i + 1}</span>
                      <span className={`font-semibold ${isCurrent ? "text-cyan-300" : ""}`}>
                        {s.title.replace(`Step ${i + 1}: `, "")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* XOR explanation */}
          <div className="p-4 rounded-lg border border-purple-500/15 bg-purple-950/20">
            <h3 className="text-xs font-bold text-purple-400/80 tracking-wider uppercase mb-2">The XOR Problem</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              XOR outputs 1 only when inputs differ (0,1 or 1,0). A single-layer network <span className="text-red-400/80">cannot</span> solve this. That's why this network has <span className="text-cyan-400/80">two hidden layers</span> — enough to learn non-linear patterns.
            </p>
          </div>
        </aside>
      </main>

      <Footer className="mt-auto" />
    </div>
  );
}
