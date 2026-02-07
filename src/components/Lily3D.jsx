import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

// ============================================================================
// ROSE GEOMETRY (Matching Sketchfab Reference by Heliona)
// ============================================================================

// Rose Petal Geometry - Spiraling, cupped, wavy edges
const RosePetalGeometry = ({ width = 1.0, length = 1.3, layer = 0 }) => {
    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(width, length, 12, 16);
        const pos = geo.attributes.position;

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const nY = (y + length / 2) / length; // 0 (base) to 1 (tip)
            const nX = x / (width / 2); // -1 to 1

            // Petal shape: narrow base, wide middle, slightly pointed tip
            const shape = Math.sin(Math.pow(nY, 0.6) * Math.PI) * (1 + nY * 0.1);
            const baseNarrow = Math.pow(nY, 0.4);
            pos.setX(i, x * shape * baseNarrow);

            // Cupping (deeper for inner petals)
            const cupDepth = 0.4 - layer * 0.05;
            const cup = Math.pow(Math.abs(nX), 1.5) * cupDepth * (1 - nY * 0.3);

            // Outer petals curve outward/downward at tips
            const tipCurve = layer > 2 ? Math.pow(nY, 2.5) * -0.5 * (layer / 5) : 0;

            // Wavy edges (more pronounced on outer petals)
            const waveStrength = 0.02 + layer * 0.01;
            const wave = Math.sin(nX * Math.PI * 3) * waveStrength * nY;

            pos.setZ(i, cup + tipCurve + wave);
        }
        geo.computeVertexNormals();
        return geo;
    }, [width, length, layer]);

    return <primitive object={geometry} attach="geometry" />;
};

// Sepal (long, thin, curving downward)
const SepalGeometry = () => {
    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(0.15, 0.8, 4, 10);
        const pos = geo.attributes.position;

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const nY = (y + 0.4) / 0.8;

            // Long pointed shape
            const wFactor = (1 - nY) * Math.sin(nY * Math.PI * 0.8);
            pos.setX(i, x * wFactor);

            // Curves downward and outward
            const curve = -Math.pow(nY, 1.5) * 0.6;
            pos.setZ(i, curve);
        }
        geo.computeVertexNormals();
        return geo;
    }, []);

    return <primitive object={geometry} attach="geometry" />;
};

// Compound Rose Leaf (three leaflets)
const RoseLeafCompound = ({ position, rotation, scale = 1 }) => {
    const leafletGeo = useMemo(() => {
        const geo = new THREE.PlaneGeometry(0.25, 0.45, 6, 8);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const nY = (y + 0.225) / 0.45;

            // Ovate shape with serrated edge
            const shape = Math.sin(nY * Math.PI);
            const serration = 1 + Math.sin(nY * Math.PI * 6) * 0.12;
            pos.setX(i, x * shape * serration);

            // Slight curve
            pos.setZ(i, -nY * 0.08);
        }
        geo.computeVertexNormals();
        return geo;
    }, []);

    return (
        <group position={position} rotation={rotation} scale={scale}>
            {/* Center leaflet (larger) */}
            <mesh geometry={leafletGeo} position={[0, 0.2, 0]} castShadow>
                <meshStandardMaterial color="#2D4A1C" roughness={0.6} side={THREE.DoubleSide} />
            </mesh>
            {/* Left leaflet */}
            <mesh geometry={leafletGeo} position={[-0.18, 0, 0]} rotation={[0, 0, 0.3]} scale={0.8} castShadow>
                <meshStandardMaterial color="#2D4A1C" roughness={0.6} side={THREE.DoubleSide} />
            </mesh>
            {/* Right leaflet */}
            <mesh geometry={leafletGeo} position={[0.18, 0, 0]} rotation={[0, 0, -0.3]} scale={0.8} castShadow>
                <meshStandardMaterial color="#2D4A1C" roughness={0.6} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
};


// ============================================================================
// COMPONENTS
// ============================================================================

// Individual Rose Petal with color variation
const RosePetal = ({ position, rotation, scale, color, layer, index }) => {
    const mesh = useRef();
    const randomOffset = useMemo(() => Math.random() * Math.PI * 2, []);

    // Slight color variation in crevices
    const matColor = useMemo(() => {
        const base = new THREE.Color(color);
        return base;
    }, [color]);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        const swayAmount = 0.008 * layer;
        mesh.current.rotation.z = rotation[2] + Math.sin(t * 0.3 + randomOffset) * swayAmount;
    });

    return (
        <mesh ref={mesh} position={position} rotation={rotation} scale={scale} castShadow receiveShadow>
            <RosePetalGeometry width={1.0} length={1.3} layer={layer} />
            <meshStandardMaterial
                color={matColor}
                emissive={new THREE.Color(color).multiplyScalar(0.02)}
                roughness={0.7}  // Matte velvety
                metalness={0.0}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};

// Sepal Component
const Sepal = ({ rotation }) => {
    return (
        <mesh rotation={rotation} position={[0, -0.3, 0]} castShadow>
            <SepalGeometry />
            <meshStandardMaterial color="#3A5F2A" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
    );
};

// Rose Stem with thorns
const RoseStem = () => {
    const curve = useMemo(() => {
        return new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0.01, -2, 0.01),
            new THREE.Vector3(-0.02, -4, -0.01),
            new THREE.Vector3(0.01, -6.5, 0.01)
        ]);
    }, []);

    const geometry = useMemo(() => new THREE.TubeGeometry(curve, 32, 0.055, 8, false), [curve]);

    // Thorn positions and rotations
    const thorns = [
        { pos: [-0.06, -1.2, 0], rot: [0, 0, 0.7] },
        { pos: [0.06, -2.0, 0.02], rot: [0, 0, -0.7] },
        { pos: [-0.05, -2.9, -0.02], rot: [0.2, 0, 0.6] },
        { pos: [0.05, -3.8, 0], rot: [0, 0, -0.6] },
        { pos: [-0.06, -4.7, 0.01], rot: [-0.1, 0, 0.7] },
        { pos: [0.06, -5.5, -0.01], rot: [0, 0, -0.7] },
    ];

    return (
        <group position={[0, -0.15, 0]}>
            <mesh geometry={geometry} castShadow>
                <meshStandardMaterial color="#3D5A2B" roughness={0.65} />
            </mesh>
            {/* Thorns (reddish-brown) */}
            {thorns.map((thorn, i) => (
                <mesh key={`thorn-${i}`} position={thorn.pos} rotation={thorn.rot}>
                    <coneGeometry args={[0.025, 0.12, 4]} />
                    <meshStandardMaterial color="#6B4423" roughness={0.5} />
                </mesh>
            ))}
        </group>
    );
};


// The Complete Rose (matching Sketchfab reference)
const Rose3D = () => {
    const group = useRef();
    const [hovered, setHover] = useState(false);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        group.current.position.y = Math.sin(t * 0.35) * 0.06;
        group.current.rotation.z = Math.sin(t * 0.18) * 0.015;
    });

    // Deep crimson palette (matching Sketchfab reference)
    const petalColors = {
        center: "#4A0010",   // Almost black-red (deep center)
        inner: "#6B0015",    // Dark crimson
        mid: "#8B0A1A",      // Rich crimson
        outer: "#A01525",    // Brighter red
        outermost: "#B8202E" // Vivid crimson edges
    };

    // Generate spiral petal layers (tighter, more realistic)
    const petalLayers = useMemo(() => {
        const layers = [];
        const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees

        // Layer 0: Tight center cone (4 petals, almost closed)
        for (let i = 0; i < 4; i++) {
            const angle = i * goldenAngle;
            layers.push({
                position: [Math.sin(angle) * 0.02, 0.55, Math.cos(angle) * 0.02],
                rotation: [0.15 + i * 0.02, angle, 0],
                scale: [0.25, 0.25, 0.25],
                color: petalColors.center,
                layer: 0
            });
        }

        // Layer 1: Tight inner spiral (5 petals)
        for (let i = 0; i < 5; i++) {
            const angle = i * goldenAngle + 0.5;
            layers.push({
                position: [Math.sin(angle) * 0.06, 0.45, Math.cos(angle) * 0.06],
                rotation: [0.35, angle, 0],
                scale: [0.38, 0.38, 0.38],
                color: petalColors.center,
                layer: 1
            });
        }

        // Layer 2: Inner (6 petals)
        for (let i = 0; i < 6; i++) {
            const angle = i * goldenAngle + 1.2;
            layers.push({
                position: [Math.sin(angle) * 0.12, 0.32, Math.cos(angle) * 0.12],
                rotation: [0.55, angle, 0],
                scale: [0.5, 0.5, 0.5],
                color: petalColors.inner,
                layer: 2
            });
        }

        // Layer 3: Mid-inner (7 petals)
        for (let i = 0; i < 7; i++) {
            const angle = i * goldenAngle + 2.0;
            layers.push({
                position: [Math.sin(angle) * 0.22, 0.18, Math.cos(angle) * 0.22],
                rotation: [0.75, angle, 0],
                scale: [0.65, 0.65, 0.65],
                color: petalColors.mid,
                layer: 3
            });
        }

        // Layer 4: Outer (8 petals)
        for (let i = 0; i < 8; i++) {
            const angle = i * goldenAngle + 3.0;
            layers.push({
                position: [Math.sin(angle) * 0.38, 0.02, Math.cos(angle) * 0.38],
                rotation: [1.0, angle, 0],
                scale: [0.8, 0.8, 0.8],
                color: petalColors.outer,
                layer: 4
            });
        }

        // Layer 5: Outermost (9 petals, most open)
        for (let i = 0; i < 9; i++) {
            const angle = i * goldenAngle + 4.2;
            layers.push({
                position: [Math.sin(angle) * 0.55, -0.12, Math.cos(angle) * 0.55],
                rotation: [1.25, angle, 0],
                scale: [0.95, 0.95, 0.95],
                color: petalColors.outermost,
                layer: 5
            });
        }

        return layers;
    }, []);

    return (
        <group ref={group}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
            scale={hovered ? 1.04 : 1}
        >
            {/* Rose Bloom */}
            <group position={[0, 0.3, 0]}>
                {petalLayers.map((petal, i) => (
                    <RosePetal key={`petal-${i}`} {...petal} index={i} />
                ))}
            </group>

            {/* Sepals (5, curving downward) */}
            <group position={[0, 0.05, 0]}>
                {[0, 1, 2, 3, 4].map((i) => (
                    <Sepal key={`sepal-${i}`} rotation={[1.4, (i / 5) * Math.PI * 2 + 0.3, 0]} />
                ))}
            </group>

            {/* Stem with thorns */}
            <RoseStem />

            {/* Compound leaves along stem */}
            <RoseLeafCompound position={[0.25, -1.5, 0.05]} rotation={[0.3, 0.8, 0.2]} scale={0.9} />
            <RoseLeafCompound position={[-0.28, -2.8, -0.05]} rotation={[0.2, -0.9, -0.15]} scale={1.0} />
            <RoseLeafCompound position={[0.22, -4.3, 0.08]} rotation={[0.25, 0.7, 0.1]} scale={0.85} />
            <RoseLeafCompound position={[-0.2, -5.6, -0.03]} rotation={[0.2, -0.6, -0.1]} scale={0.75} />
        </group>
    );
};


// ============================================================================
// SCENE
// ============================================================================

const Scene = () => {
    return (
        <div style={{ width: '100vw', height: '100vh', background: 'linear-gradient(180deg, #0a0a12 0%, #1a1520 50%, #0d0810 100%)' }}>
            <Canvas shadows gl={{ antialias: true }}>
                <PerspectiveCamera makeDefault position={[0, 0.5, 4.5]} fov={50} />
                <OrbitControls enableZoom={true} maxPolarAngle={Math.PI / 1.2} autoRotate autoRotateSpeed={0.35} />

                {/* Soft directional lighting (like Sketchfab reference) */}
                <ambientLight intensity={0.3} color="#fff5f5" />
                <directionalLight
                    position={[4, 8, 3]}
                    intensity={1.4}
                    color="#fff8f5"
                    castShadow
                    shadow-mapSize-width={1024}
                    shadow-mapSize-height={1024}
                />
                <directionalLight position={[-3, 4, -2]} intensity={0.35} color="#ffd5d5" />
                <pointLight position={[0, 2, 3]} intensity={0.4} color="#ffb0b0" />

                <Environment preset="studio" background={false} />

                <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.25}>
                    <Rose3D />
                </Float>
            </Canvas>
            <div style={{
                position: 'absolute',
                bottom: 20,
                width: '100%',
                textAlign: 'center',
                color: '#e0b0b0',
                fontFamily: 'Georgia, serif',
                fontSize: '16px',
                fontStyle: 'italic',
                opacity: 0.85,
                pointerEvents: 'none',
                textShadow: '0 0 12px rgba(150,30,30,0.4)'
            }}>
                A Long-Stemmed Rose
            </div>
        </div>
    );
};

export default Scene;
