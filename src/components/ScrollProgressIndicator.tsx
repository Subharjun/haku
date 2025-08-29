'use client';
import React, { useEffect, useRef } from 'react';

const ScrollProgressIndicator = () => {
    const scrollBarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (scrollBarRef.current) {
                const { scrollHeight, clientHeight } = document.documentElement;
                const scrollableHeight = scrollHeight - clientHeight;
                const scrollY = window.scrollY;
                const scrollProgress = (scrollY / scrollableHeight) * 100;

                scrollBarRef.current.style.transform = `translateY(-${
                    100 - scrollProgress
                }%)`;
            }
        };

        handleScroll();

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);    return (
        <div className="fixed top-[50svh] right-[2%] -translate-y-1/2 w-2 h-[120px] rounded-full bg-gray-800/50 overflow-hidden backdrop-blur-sm border border-gray-600/70 z-50 shadow-lg">
            <div
                className="w-full bg-white rounded-full h-full shadow-xl shadow-white/20"
                ref={scrollBarRef}
                style={{ transform: 'translateY(-100%)', filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))' }}
            ></div>
        </div>
    );
};

export default ScrollProgressIndicator;
