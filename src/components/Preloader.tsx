'use client';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import React, { useRef } from 'react';

gsap.registerPlugin(useGSAP);

const Preloader = () => {
    const preloaderRef = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            const tl = gsap.timeline({
                defaults: {
                    ease: 'power1.inOut',
                },
            });

            tl.to('.name-text span', {
                y: 0,
                stagger: 0.05,
                duration: 0.2,
            });

            tl.to('.preloader-item', {
                delay: 1,
                y: '100%',
                duration: 0.5,
                stagger: 0.1,
            })
                .to('.name-text span', { autoAlpha: 0 }, '<0.5')
                .to(
                    preloaderRef.current,
                    {
                        autoAlpha: 0,
                        pointerEvents: 'none',
                    },
                    '<1',
                );
        },
        { scope: preloaderRef },
    );

    return (        <div className="fixed inset-0 z-[100] flex" ref={preloaderRef}>
            <div className="preloader-item h-full w-[10%] bg-gradient-to-b from-gray-900 via-black to-gray-900"></div>
            <div className="preloader-item h-full w-[10%] bg-gradient-to-b from-gray-800 via-black to-gray-800"></div>
            <div className="preloader-item h-full w-[10%] bg-gradient-to-b from-gray-700 via-black to-gray-700"></div>
            <div className="preloader-item h-full w-[10%] bg-gradient-to-b from-gray-900 via-black to-gray-900"></div>
            <div className="preloader-item h-full w-[10%] bg-gradient-to-b from-gray-800 via-black to-gray-800"></div>
            <div className="preloader-item h-full w-[10%] bg-gradient-to-b from-gray-700 via-black to-gray-700"></div>
            <div className="preloader-item h-full w-[10%] bg-gradient-to-b from-gray-900 via-black to-gray-900"></div>
            <div className="preloader-item h-full w-[10%] bg-gradient-to-b from-gray-800 via-black to-gray-800"></div>
            <div className="preloader-item h-full w-[10%] bg-gradient-to-b from-gray-700 via-black to-gray-700"></div>
            <div className="preloader-item h-full w-[10%] bg-gradient-to-b from-gray-900 via-black to-gray-900"></div>

            <p className="name-text flex text-[20vw] lg:text-[200px] font-bold text-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 leading-none overflow-hidden">
                <span className="inline-block translate-y-full text-gray-300">L</span>
                <span className="inline-block translate-y-full text-gray-200">E</span>
                <span className="inline-block translate-y-full text-gray-100">N</span>
                <span className="inline-block translate-y-full text-white">D</span>
                <span className="inline-block translate-y-full text-gray-200">-</span>
                <span className="inline-block translate-y-full text-gray-100">I</span>
                <span className="inline-block translate-y-full text-gray-300">T</span>
            </p>
        </div>
    );
};

export default Preloader;
