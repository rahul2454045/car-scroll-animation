'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * ============================================================================
 * HeroScrollAnimation (React / Next.js Component)
 * ============================================================================
 * 
 * Recreates the scroll-driven McLaren 720S hero experience within modern
 * React and Next.js applications (App Router or Pages Router).
 * 
 * Features:
 * - GSAP ScrollTrigger with smooth scrub interpolation
 * - Collision detection lighting up "WELCOME ITZ FIZZ" character by character
 * - Dynamic rolling percentage counters for impact metrics
 * - Real-time Cockpit Speedometer HUD
 * - Clean cleanup on component unmount to prevent memory leaks
 */
export default function HeroScrollAnimation() {
  const containerRef = useRef(null);
  const stickyRef = useRef(null);
  const roadRef = useRef(null);
  const supercarRef = useRef(null);
  const trailRef = useRef(null);
  const headlineRef = useRef(null);
  const speedDisplayRef = useRef(null);
  const gearDisplayRef = useRef(null);
  const progressBarRef = useRef(null);

  useEffect(() => {
    // Register ScrollTrigger inside client effect
    gsap.registerPlugin(ScrollTrigger);

    const container = containerRef.current;
    const sticky = stickyRef.current;
    const road = roadRef.current;
    const supercar = supercarRef.current;
    const trail = trailRef.current;
    const headline = headlineRef.current;

    if (!container || !sticky || !road || !supercar) return;

    // Characters in the headline
    const charElements = headline.querySelectorAll('.headline-char');
    const statCards = container.querySelectorAll('.stat-item');

    // 1. Initial Page Load Animation
    const introTL = gsap.timeline({ defaults: { ease: 'power3.out' } });

    introTL.fromTo(supercar, 
      { x: -70, opacity: 0 },
      { x: 0, opacity: 1, duration: 1.1 }
    );

    introTL.fromTo(charElements,
      { opacity: 0, y: 15 },
      { opacity: 0.2, y: 0, duration: 0.5, stagger: 0.03 },
      '-=0.7'
    );

    introTL.fromTo(statCards,
      { opacity: 0, y: 20 },
      { opacity: 0.35, y: 0, duration: 0.6, stagger: 0.1 },
      '-=0.4'
    );

    // 2. Geometry caching
    const updateGeometry = () => {
      const roadRect = road.getBoundingClientRect();
      const carW = supercar.offsetWidth;
      const endX = road.offsetWidth - carW;

      const charData = Array.from(charElements).map((char) => {
        const rect = char.getBoundingClientRect();
        return {
          el: char,
          left: rect.left - roadRect.left,
        };
      });

      return { endX, carW, charData };
    };

    let geo = updateGeometry();

    // 3. ScrollTrigger Supercar Motion
    const mainST = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.2,
      pin: sticky,
      pinSpacing: true,
      invalidateOnRefresh: true,
      onRefresh: () => {
        geo = updateGeometry();
      },
      onUpdate: (self) => {
        const prog = self.progress;
        const currentX = prog * geo.endX;
        const carFront = currentX + (geo.carW * 0.75);

        // Move car
        gsap.set(supercar, { x: currentX });

        // Update trail width
        if (trail) {
          gsap.set(trail, { width: carFront });
        }

        // Letter collision
        geo.charData.forEach((item) => {
          if (carFront >= item.left) {
            item.el.classList.add('illuminated');
          } else {
            item.el.classList.remove('illuminated');
          }
        });

        // Top progress bar
        if (progressBarRef.current) {
          progressBarRef.current.style.width = `${prog * 100}%`;
        }

        // Speedometer calculation
        let speed = Math.round(prog * 312);
        let gear = prog < 0.2 ? 'D1' : prog < 0.4 ? 'D2' : prog < 0.7 ? 'D3' : prog < 0.9 ? 'D4' : 'D5';
        if (prog <= 0.02) { speed = 0; gear = 'N'; }

        if (speedDisplayRef.current) speedDisplayRef.current.textContent = speed;
        if (gearDisplayRef.current) gearDisplayRef.current.textContent = gear;
      }
    });

    // 4. Milestone Triggers for Cards
    statCards.forEach((card, idx) => {
      const numberEl = card.querySelector('.stat-number');
      const target = parseInt(numberEl.getAttribute('data-target') || '0', 10);
      let triggered = false;

      ScrollTrigger.create({
        trigger: container,
        start: () => `top+=${window.innerHeight * (0.2 + idx * 0.22)} top`,
        end: () => `top+=${window.innerHeight * (0.35 + idx * 0.22)} top`,
        onEnter: () => {
          card.style.opacity = '1';
          if (!triggered) {
            triggered = true;
            const obj = { val: 0 };
            gsap.to(obj, {
              val: target,
              duration: 1.2,
              ease: 'power2.out',
              onUpdate: () => { numberEl.textContent = Math.round(obj.val); }
            });
          }
        },
        onLeaveBack: () => {
          card.style.opacity = '0.35';
          triggered = false;
          numberEl.textContent = '0';
        }
      });
    });

    // Cleanup triggers on unmount
    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div className="relative bg-[#090a0f] text-slate-100 min-h-screen overflow-x-hidden">
      {/* Scroll progress line */}
      <div ref={progressBarRef} className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 z-50 w-0 transition-all" />

      {/* Cockpit HUD Navbar */}
      <nav className="fixed top-0 inset-x-0 z-40 h-20 bg-slate-950/70 backdrop-blur-md border-b border-white/10 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 font-black text-xl tracking-wider text-emerald-400">
          ⚡ ITZ FIZZ
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-cyan-300">
            SPEED: <span ref={speedDisplayRef} className="font-bold text-white">0</span> KM/H
          </div>
          <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-emerald-300">
            GEAR: <span ref={gearDisplayRef} className="font-bold text-emerald-400">N</span>
          </div>
        </div>
      </nav>

      {/* Pinned Scroll Container */}
      <div ref={containerRef} className="relative h-[280vh]">
        <div ref={stickyRef} className="sticky top-0 h-screen w-full flex flex-col justify-center items-center overflow-hidden">
          
          {/* Road Track */}
          <div ref={roadRef} className="relative w-full h-[220px] bg-[#181b24] border-y-2 border-slate-700/60 flex items-center overflow-visible shadow-2xl">
            
            {/* Speed Trail */}
            <div ref={trailRef} className="absolute top-0 left-0 h-full w-0 bg-gradient-to-r from-emerald-500/20 via-emerald-400/40 to-cyan-400/60 pointer-events-none z-10" />

            {/* Supercar */}
            <div ref={supercarRef} className="absolute top-1/2 -translate-y-1/2 left-0 w-[220px] z-20 pointer-events-none">
              <img src="/assets/car.png" alt="McLaren 720S" className="w-full h-auto drop-shadow-[0_15px_15px_rgba(0,0,0,0.8)]" />
            </div>

            {/* Headline */}
            <h1 ref={headlineRef} className="absolute top-1/2 -translate-y-1/2 left-[5%] flex gap-3 text-6xl font-black tracking-widest text-white/20 uppercase z-10 pointer-events-none select-none">
              {['W','E','L','C','O','M','E',' ','I','T','Z',' ','F','I','Z','Z'].map((letter, idx) => (
                letter === ' ' ? (
                  <span key={idx} className="w-8 inline-block" />
                ) : (
                  <span key={idx} className="headline-char transition-colors duration-200" data-char={letter}>
                    {letter}
                  </span>
                )
              ))}
            </h1>
          </div>

          {/* Metric Cards Layer */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Card 1 */}
            <div className="stat-item absolute top-[6%] left-[20%] p-4 rounded-xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
              <span className="text-[10px] font-mono bg-lime-300 text-black px-1.5 py-0.5 rounded font-bold uppercase">Efficiency</span>
              <div className="text-3xl font-extrabold text-lime-300 mt-1">
                <span className="stat-number" data-target="58">0</span>%
              </div>
              <p className="text-xs text-slate-300 mt-1">Increase in pick up point use</p>
            </div>

            {/* Card 2 */}
            <div className="stat-item absolute bottom-[6%] left-[38%] p-4 rounded-xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
              <span className="text-[10px] font-mono bg-cyan-400 text-black px-1.5 py-0.5 rounded font-bold uppercase">Automation</span>
              <div className="text-3xl font-extrabold text-cyan-300 mt-1">
                <span className="stat-number" data-target="23">0</span>%
              </div>
              <p className="text-xs text-slate-300 mt-1">Decreased customer phone calls</p>
            </div>

            {/* Card 3 */}
            <div className="stat-item absolute top-[6%] right-[18%] p-4 rounded-xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
              <span className="text-[10px] font-mono bg-white text-black px-1.5 py-0.5 rounded font-bold uppercase">Velocity</span>
              <div className="text-3xl font-extrabold text-white mt-1">
                <span className="stat-number" data-target="27">0</span>%
              </div>
              <p className="text-xs text-slate-300 mt-1">Boost in turnaround & pick up use</p>
            </div>

            {/* Card 4 */}
            <div className="stat-item absolute bottom-[6%] right-[6%] p-4 rounded-xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
              <span className="text-[10px] font-mono bg-orange-400 text-black px-1.5 py-0.5 rounded font-bold uppercase">Operations</span>
              <div className="text-3xl font-extrabold text-orange-400 mt-1">
                <span className="stat-number" data-target="40">0</span>%
              </div>
              <p className="text-xs text-slate-300 mt-1">Decreased operational overhead</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
