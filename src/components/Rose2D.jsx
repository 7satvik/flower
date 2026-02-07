import React, { useState, useEffect } from 'react';
import './Rose2D.css';
import roseImage from '/rose-colored.png?url';

const Rose2D = () => {
    const [isOpened, setIsOpened] = useState(false);
    const [showContent, setShowContent] = useState(false);
    const [petals, setPetals] = useState([]);

    // Generate falling petals
    useEffect(() => {
        if (isOpened) {
            const newPetals = [];
            for (let i = 0; i < 30; i++) {
                newPetals.push({
                    id: i,
                    left: Math.random() * 100,
                    delay: Math.random() * 3,
                    duration: 3 + Math.random() * 4,
                    size: 15 + Math.random() * 20,
                });
            }
            setPetals(newPetals);

            // Show content after envelope opens
            setTimeout(() => setShowContent(true), 800);
        }
    }, [isOpened]);

    const handleOpen = () => {
        setIsOpened(true);
    };

    return (
        <div className="rose-container">
            <div className="rose-background"></div>

            {/* Falling Petals */}
            {isOpened && petals.map((petal) => (
                <div
                    key={petal.id}
                    className="falling-petal"
                    style={{
                        left: `${petal.left}%`,
                        animationDelay: `${petal.delay}s`,
                        animationDuration: `${petal.duration}s`,
                        fontSize: `${petal.size}px`,
                    }}
                >
                    🌸
                </div>
            ))}

            {/* Envelope / Gift Box */}
            {!isOpened && (
                <div className="envelope-container" onClick={handleOpen}>
                    <div className="envelope">
                        <div className="envelope-flap"></div>
                        <div className="envelope-body">
                            <div className="envelope-heart">💝</div>
                        </div>
                    </div>
                    <p className="tap-text">Tap to Open Your Gift</p>
                    <div className="sparkles">
                        <span className="sparkle">✨</span>
                        <span className="sparkle">✨</span>
                        <span className="sparkle">✨</span>
                    </div>
                </div>
            )}

            {/* Rose Content (revealed after opening) */}
            {showContent && (
                <div className={`rose-content ${showContent ? 'visible' : ''}`}>
                    <img
                        src={roseImage}
                        alt="Rose"
                        className="rose-image"
                    />

                    <h1 className="rose-text">Happy Rose Day</h1>
                    <p className="rose-subtext">❤️ With Love ❤️</p>

                    <div className="love-message">
                        <p>A rose speaks of love silently,</p>
                        <p>in a language known only to the heart 💕</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Rose2D;
