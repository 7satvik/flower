import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const Lily = () => {
    const [isOpen, setIsOpen] = useState(false);

    // Mouse position state
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth mouse movement with different configs for layers (parallax)
    const springConfig = { damping: 20, stiffness: 100 };
    const springConfigLag = { damping: 30, stiffness: 80 }; // Slower, heavier feel

    // Base rotation
    const rotateX = useSpring(useTransform(y, [-300, 300], [20, -20]), springConfig);
    const rotateY = useSpring(useTransform(x, [-300, 300], [-20, 20]), springConfig);

    // Layered rotation (Parallax)
    const rotateX_outer = useSpring(useTransform(y, [-300, 300], [25, -25]), springConfigLag);
    const rotateY_outer = useSpring(useTransform(x, [-300, 300], [-25, 25]), springConfigLag);

    // Idle "Breathing" and "Sway" Animation
    // We'll overlay this on the rotation

    useEffect(() => {
        // Bloom on mount
        const timer = setTimeout(() => setIsOpen(true), 500);
        return () => clearTimeout(timer);
    }, []);

    const handleMove = (clientX, clientY) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        x.set(clientX - centerX);
        y.set(clientY - centerY);
    };

    const handleMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e) => handleMove(e.touches[0].clientX, e.touches[0].clientY);

    const petalVariants = {
        closed: { scale: 0.5, opacity: 0, rotateX: 60, rotateY: 0 },
        open: (i) => ({
            scale: 1,
            opacity: 1,
            rotateX: 0,
            transition: {
                delay: i * 0.1,
                duration: 3,
                type: "spring",
                stiffness: 50
            },
        }),
        hover: {
            scale: 1.05,
            filter: "brightness(1.1)",
        }
    };

    // Organic, recurved petal path
    const petalPath = "M0,0 C15,-40 55,-90 0,-160 C-55,-90 -15,-40 0,0";

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'radial-gradient(circle at center, #0f0508 0%, #000000 100%)',
                overflow: 'hidden',
                touchAction: 'none',
                perspective: '1200px' // Essential for 3D
            }}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
        >
            {/* Container for the whole flower */}
            <motion.div
                style={{
                    width: 0,
                    height: 0,
                    position: 'relative',
                    transformStyle: 'preserve-3d', // Enable 3D children
                    rotateX,
                    rotateY,
                }}
                animate={{
                    rotateZ: [0, 2, 0, -2, 0], // Gentle sway
                    y: [0, -10, 0], // Gentle bobbing
                }}
                transition={{
                    repeat: Infinity,
                    duration: 6,
                    ease: "easeInOut"
                }}
            >

                {/* === Layer 1: Stem & Leaves (Furthest Back) === */}
                <motion.div
                    style={{
                        position: 'absolute',
                        top: 0, left: 0,
                        translateZ: -50,
                        transformStyle: 'preserve-3d'
                    }}
                >
                    <svg width="400" height="400" viewBox="-200 -200 400 400" style={{ overflow: 'visible' }}>
                        <motion.path
                            d="M0,0 Q-10,150 -5,300"
                            stroke="#2e8b57"
                            strokeWidth="8"
                            fill="none"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2 }}
                        />
                        {[1, -1].map((side, i) => (
                            <motion.path
                                key={`leaf-${i}`}
                                d={`M0,150 Q${60 * side},100 ${100 * side},180 Q${40 * side},220 0,150`}
                                fill="#2e8b57"
                                opacity="0.9"
                                initial={{ scale: 0, rotateY: 90 }} // Start folded
                                animate={{ scale: 1, rotateY: 0 }}
                                transition={{ delay: 1.5, duration: 2 }}
                            />
                        ))}
                    </svg>
                </motion.div>


                {/* === Layer 2: Outer Petals (Middle Depth) === */}
                <motion.div
                    style={{
                        position: 'absolute',
                        top: 0, left: 0,
                        translateZ: 0,
                        transformStyle: 'preserve-3d',
                        rotateX: rotateX_outer, // Independent rotation for drag effect
                        rotateY: rotateY_outer
                    }}
                >
                    <svg width="0" height="0" style={{ overflow: 'visible' }}>
                        <defs>
                            <linearGradient id="petalGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#fff0f5" />
                                <stop offset="30%" stopColor="#ffb7c5" />
                                <stop offset="100%" stopColor="#ff1493" />
                            </linearGradient>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                        </defs>
                    </svg>
                    {/* Render petals as individual 3D elements for true depth */}
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={`petal-outer-${i}`}
                            style={{
                                position: 'absolute',
                                transformStyle: 'preserve-3d',
                                rotate: i * 120,
                                transformOrigin: 'center',
                            }}
                        >
                            <motion.svg width="200" height="200" viewBox="-100 -200 200 400" style={{ overflow: 'visible', position: 'absolute', left: -100, top: -200 }}>
                                <motion.path
                                    d={petalPath}
                                    fill="url(#petalGradient)"
                                    stroke="rgba(255,105,180, 0.4)"
                                    strokeWidth="1"
                                    filter="url(#glow)"
                                    custom={i}
                                    variants={petalVariants}
                                    // Add independent breathing per petal
                                    animate={{
                                        d: [
                                            "M0,0 C15,-40 55,-90 0,-160 C-55,-90 -15,-40 0,0", // Normal
                                            "M0,0 C18,-45 58,-95 0,-165 C-58,-95 -18,-45 0,0", // Expanded
                                            "M0,0 C15,-40 55,-90 0,-160 C-55,-90 -15,-40 0,0" // Normal
                                        ]
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        delay: i * 0.5,
                                        ease: "easeInOut"
                                    }}
                                />
                            </motion.svg>
                        </motion.div>
                    ))}
                </motion.div>

                {/* === Layer 3: Inner Petals & Details (Front) === */}
                <motion.div
                    style={{
                        position: 'absolute',
                        top: 0, left: 0,
                        translateZ: 30, // Push forward
                        transformStyle: 'preserve-3d',
                    }}
                >
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={`petal-inner-${i}`}
                            style={{
                                position: 'absolute',
                                transformStyle: 'preserve-3d',
                                rotate: i * 120 + 60, // Offset 60 deg
                                transformOrigin: 'center',
                            }}
                        >
                            <motion.svg width="200" height="200" viewBox="-100 -200 200 400" style={{ overflow: 'visible', position: 'absolute', left: -100, top: -200 }}>
                                <motion.path
                                    d={petalPath}
                                    fill="url(#petalGradient)"
                                    stroke="rgba(255,105,180, 0.6)"
                                    strokeWidth="1"
                                    custom={i + 0.5}
                                    variants={petalVariants}
                                    filter="url(#glow)"
                                />
                                {/* Spots on inner petals */}
                                {[...Array(5)].map((_, j) => (
                                    <motion.circle
                                        key={j}
                                        cx={Math.sin(j) * 5}
                                        cy={-40 - j * 10}
                                        r={1.5}
                                        fill="#8b0000"
                                        opacity={0.7}
                                    />
                                ))}
                            </motion.svg>
                        </motion.div>
                    ))}
                </motion.div>

                {/* === Layer 4: Stamens & Pistil (Center, Furthest Front) === */}
                <motion.div
                    style={{
                        position: 'absolute',
                        translateZ: 50,
                        rotateX, // Stamen track strictly with base rotation
                        rotateY,
                        transformStyle: 'preserve-3d'
                    }}
                >
                    <svg width="200" height="200" viewBox="-100 -100 200 200" style={{ overflow: 'visible' }}>
                        {/* Pistil */}
                        <motion.circle cx="0" cy="0" r="5" fill="#32cd32" />

                        {/* Stamens - 3D Radiating */}
                        {[...Array(6)].map((_, i) => (
                            <motion.g
                                key={`stamen-${i}`}
                                transform={`rotate(${i * 60})`}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={isOpen ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                                transition={{ delay: 2, duration: 1 }}
                            >
                                <line x1="0" y1="0" x2="0" y2="-60" stroke="#dcf0ca" strokeWidth="2" />
                                <ellipse cx="0" cy="-65" rx="4" ry="8" fill="#8b4513" />
                            </motion.g>
                        ))}
                    </svg>
                </motion.div>

            </motion.div>

            <div style={{
                position: 'absolute',
                bottom: 30,
                color: '#ffb7c5',
                fontFamily: 'Courier New, monospace',
                textTransform: 'uppercase',
                letterSpacing: '4px',
                fontSize: '14px',
                opacity: 0.7,
                textShadow: '0 0 10px #ff1493'
            }}>
                Living 3D Lily
            </div>
        </div>
    );
};

export default Lily;
