import React from 'react';
import './Rose2D.css';

const Rose2D = () => {
    return (
        <div className="rose-container">
            <div className="rose-background"></div>

            <img
                src="/rose-colored.png"
                alt="Rose"
                className="rose-image"
            />

            <h1 className="rose-text">Happy Rose Day</h1>
            <p className="rose-subtext">❤️ With Love ❤️</p>
        </div>
    );
};

export default Rose2D;
