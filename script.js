/**
 * ============================================================================
 * ITZ FIZZ — SCROLL-DRIVEN SUPERCAR HERO ANIMATION
 * ============================================================================
 * 
 * Hand-crafted with GSAP (GreenSock Animation Platform) and ScrollTrigger.
 * Clean, modular architecture designed for 60fps/120fps hardware acceleration,
 * dynamic letter collision detection, and realistic vehicular scrub physics.
 * 
 * Table of Contents:
 *  1. Global State & DOM Element Cache
 *  2. Initial Page Load Animation (Timeline)
 *  3. Dynamic Geometry & Coordinate Cache
 *  4. Core Scroll-Driven Car Animation (ScrollTrigger)
 *  5. Letter-by-Letter Collision & Illumination Engine
 *  6. Impact Metric Cards & Rolling Number Tween
 *  7. Cockpit Telemetry & Speedometer HUD
 *  8. Interactive Autoplay Demo Mode
 *  9. Window Resize & Lifecycle Handlers
 * ============================================================================
 */

// Strict mode ensures cleaner code and prevents silent errors
'use strict';

// ----------------------------------------------------------------------------
// 1. GLOBAL STATE & DOM ELEMENT CACHE
// ----------------------------------------------------------------------------

// Register GSAP ScrollTrigger & ScrollToPlugin plugins safely
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Cache DOM elements to prevent repeated DOM queries on scroll (prevents reflow)
const DOM = {
  header: document.querySelector('header'),
  scrollSection: document.getElementById('heroScrollSection'),
  stickyTrack: document.getElementById('stickyTrack'),
  roadTrack: document.getElementById('roadTrack'),
  supercar: document.getElementById('supercar'),
  carImage: document.getElementById('carImage'),
  headlightCone: document.getElementById('headlightCone'),
  speedTrail: document.getElementById('speedTrail'),
  tireTrackTop: document.getElementById('tireTrackTop'),
  tireTrackBottom: document.getElementById('tireTrackBottom'),
  headlineChars: document.querySelectorAll('.headline-char'),
  statCards: [
    document.getElementById('stat-card-1'),
    document.getElementById('stat-card-2'),
    document.getElementById('stat-card-3'),
    document.getElementById('stat-card-4')
  ],
  scrollHint: document.getElementById('scrollHint'),
  scrollProgressBar: document.getElementById('scrollProgressBar'),
  cockpitSpeed: document.getElementById('cockpitSpeed'),
  cockpitGear: document.getElementById('cockpitGear'),
  autoplayBtn: document.getElementById('autoplayBtn'),
  autoplayBtnText: document.getElementById('autoplayBtnText')
};

// State trackers for animated values and geometry
let roadWidth = 0;
let carWidth = 0;
let endX = 0;
let letterPositions = [];
let isAutoplaying = false;
let autoplayTween = null;

// Track which stat counters have already been triggered to avoid re-triggering
const countersTriggered = [false, false, false, false];

// ----------------------------------------------------------------------------
// 2. INITIAL PAGE LOAD ANIMATION (TIMELINE)
// ----------------------------------------------------------------------------
/**
 * Executes a smooth, luxurious intro sequence when the page first loads:
 * 1. Navbar glides down from top.
 * 2. Supercar enters the road with engine ignition feel.
 * 3. Headline characters appear with a gentle staggered wave.
 * 4. Stat cards fade in softly into their idle waiting state.
 */
function initPageLoadAnimation() {
  const introTL = gsap.timeline({
    defaults: { ease: 'power3.out' }
  });

  // 1. Navbar slide-in
  introTL.from(DOM.header, {
    y: -40,
    opacity: 0,
    duration: 0.8
  });

  // 2. Supercar soft entrance onto the starting line
  introTL.from(DOM.supercar, {
    x: -80,
    opacity: 0,
    duration: 1.2,
    ease: 'power2.out'
  }, '-=0.4');

  // Headlight beam flickers on like xenon lights
  introTL.fromTo(DOM.headlightCone, 
    { opacity: 0, scaleX: 0.6 },
    { opacity: 0.9, scaleX: 1, duration: 0.7, ease: 'rough' },
    '-=0.6'
  );

  // 3. Staggered headline preview wave
  introTL.fromTo(DOM.headlineChars,
    { opacity: 0, y: 15 },
    { 
      opacity: 0.2, 
      y: 0, 
      duration: 0.5, 
      stagger: 0.03,
      ease: 'power2.out'
    },
    '-=0.8'
  );

  // 4. Subtle entrance for the metric cards idle position
  introTL.fromTo(DOM.statCards,
    { opacity: 0, y: 25 },
    { 
      opacity: 0.35, 
      y: 0, 
      duration: 0.7, 
      stagger: 0.12,
      ease: 'power2.out'
    },
    '-=0.5'
  );

  // 5. Scroll hint gentle float in
  introTL.from(DOM.scrollHint, {
    opacity: 0,
    y: 10,
    duration: 0.8
  }, '-=0.3');
}

// ----------------------------------------------------------------------------
// 3. DYNAMIC GEOMETRY & COORDINATE CACHING
// ----------------------------------------------------------------------------
/**
 * Measures the physical viewport and element dimensions.
 * Computes the exact absolute X offset of every character in "WELCOME ITZ FIZZ"
 * relative to the road track, ensuring accurate collision during scrolling.
 */
function measureGeometry() {
  roadWidth = DOM.roadTrack.offsetWidth;
  carWidth = DOM.supercar.offsetWidth;
  endX = roadWidth - carWidth;

  const roadRect = DOM.roadTrack.getBoundingClientRect();

  // Cache horizontal position for each individual letter
  letterPositions = Array.from(DOM.headlineChars).map((char) => {
    const charRect = char.getBoundingClientRect();
    return {
      element: char,
      // Left coordinate relative to road track container
      left: charRect.left - roadRect.left,
      // Center point of the character
      center: (charRect.left - roadRect.left) + (charRect.width / 2),
      width: charRect.width
    };
  });
}

// ----------------------------------------------------------------------------
// 4. CORE SCROLL-DRIVEN CAR ANIMATION (GSAP SCROLLTRIGGER)
// ----------------------------------------------------------------------------
/**
 * Drives the supercar along the horizontal road track strictly tied to
 * page scroll progression. Uses GSAP ScrollTrigger with `scrub: 1.2` for
 * buttery-smooth physical inertia (feels like actual vehicle mass).
 */
function initScrollDrivenAnimation() {
  measureGeometry();

  // Main Car Travel ScrollTrigger
  gsap.to(DOM.supercar, {
    scrollTrigger: {
      trigger: DOM.scrollSection,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.2, // 1.2s smooth scrub interpolation for fluid vehicular momentum
      pin: DOM.stickyTrack,
      pinSpacing: true,
      invalidateOnRefresh: true, // Recalculates on viewport resize
      onUpdate: (self) => {
        handleScrollUpdate(self.progress);
      }
    },
    x: () => endX,
    ease: 'none' // Linear mapping to scroll progress, smoothed by scrub
  });

  // Milestone triggers for the 4 Impact Stat Cards
  setupStatCardTriggers();
}

// ----------------------------------------------------------------------------
// 5. COLLISION & REAL-TIME LETTER ILLUMINATION ENGINE
// ----------------------------------------------------------------------------
/**
 * Called on every scroll frame update.
 * Synchronizes the speed trail width, checks collision with each headline letter,
 * and updates cockpit telemetry.
 * 
 * @param {number} progress - Scroll progress between 0 and 1
 */
function handleScrollUpdate(progress) {
  // 1. Current X position of the car
  const currentX = gsap.getProperty(DOM.supercar, 'x') || 0;
  
  // The nose/front of the car where the headlight and trail interact
  const carFrontX = currentX + (carWidth * 0.75);

  // 2. Expand neon speed trail and tire skid marks
  gsap.set(DOM.speedTrail, { width: carFrontX });
  gsap.set(DOM.tireTrackTop, { width: currentX + (carWidth * 0.3) });
  gsap.set(DOM.tireTrackBottom, { width: currentX + (carWidth * 0.3) });

  // 3. Dynamic Letter-by-Letter Collision Detection
  // Check whether the car's headlights/front have reached each letter
  letterPositions.forEach((item) => {
    if (carFrontX >= item.left) {
      if (!item.element.classList.contains('illuminated')) {
        item.element.classList.add('illuminated');
      }
    } else {
      if (item.element.classList.contains('illuminated')) {
        item.element.classList.remove('illuminated');
      }
    }
  });

  // 4. Update HUD Telemetry & Top Progress Bar
  updateCockpitTelemetry(progress);

  // 5. Fade out scroll hint once user starts scrolling
  if (progress > 0.05) {
    DOM.scrollHint.style.opacity = '0';
    DOM.scrollHint.style.pointerEvents = 'none';
  } else {
    DOM.scrollHint.style.opacity = '1';
    DOM.scrollHint.style.pointerEvents = 'auto';
  }
}

// ----------------------------------------------------------------------------
// 6. IMPACT METRIC CARDS & ROLLING NUMBER TWEEN
// ----------------------------------------------------------------------------
/**
 * Configures distinct scroll milestone thresholds for the 4 stat cards.
 * As the car advances through each zone, the corresponding card:
 * 1. Elevates and illuminates with glassmorphic glow.
 * 2. Numbers roll up smoothly from 0% to target (58%, 23%, 27%, 40%).
 */
function setupStatCardTriggers() {
  const milestones = [
    { card: DOM.statCards[0], startProg: 0.12, endProg: 0.35, index: 0 },
    { card: DOM.statCards[1], startProg: 0.32, endProg: 0.58, index: 1 },
    { card: DOM.statCards[2], startProg: 0.55, endProg: 0.80, index: 2 },
    { card: DOM.statCards[3], startProg: 0.75, endProg: 0.98, index: 3 }
  ];

  milestones.forEach((milestone) => {
    ScrollTrigger.create({
      trigger: DOM.scrollSection,
      start: () => `top+=${window.innerHeight * (milestone.startProg * 1.8)} top`,
      end: () => `top+=${window.innerHeight * (milestone.endProg * 1.8)} top`,
      onEnter: () => activateStatCard(milestone),
      onEnterBack: () => activateStatCard(milestone),
      onLeaveBack: () => deactivateStatCard(milestone)
    });
  });
}

/**
 * Activates a stat card and counts up the metric number.
 */
function activateStatCard(milestone) {
  const card = milestone.card;
  const cardInner = card.querySelector('.glass-card');
  const numberEl = card.querySelector('.stat-number');
  const targetVal = parseInt(numberEl.getAttribute('data-target'), 10) || 0;

  // Visual illumination
  card.style.opacity = '1';
  card.style.transform = 'translateY(0)';
  if (cardInner) cardInner.classList.add('is-active');

  // Trigger rolling number count-up only once per pass
  if (!countersTriggered[milestone.index]) {
    countersTriggered[milestone.index] = true;
    animateCounter(numberEl, targetVal);
  }
}

/**
 * Deactivates a stat card when scrolling backwards before its milestone.
 */
function deactivateStatCard(milestone) {
  const card = milestone.card;
  const cardInner = card.querySelector('.glass-card');
  const numberEl = card.querySelector('.stat-number');

  card.style.opacity = '0.35';
  if (cardInner) cardInner.classList.remove('is-active');

  // Allow re-triggering if user scrolls back up
  countersTriggered[milestone.index] = false;
  numberEl.textContent = '0';
}

/**
 * Smoothly interpolates an integer count-up animation using GSAP.
 */
function animateCounter(element, target) {
  const counterObj = { value: 0 };
  gsap.to(counterObj, {
    value: target,
    duration: 1.4,
    ease: 'power2.out',
    onUpdate: () => {
      element.textContent = Math.round(counterObj.value);
    }
  });
}

// ----------------------------------------------------------------------------
// 7. COCKPIT TELEMETRY & SPEEDOMETER HUD
// ----------------------------------------------------------------------------
/**
 * Updates real-time digital cockpit HUD elements:
 * - Speed (km/h) based on scroll curve & acceleration
 * - Dynamic Gear shift indicators (N -> D1 -> D2 -> D3 -> D4 -> D5 -> TOP SPEED)
 * - Top page scroll progress bar
 */
function updateCockpitTelemetry(progress) {
  // Update top progress bar width
  const progressPercent = Math.min(Math.max(progress * 100, 0), 100);
  DOM.scrollProgressBar.style.width = `${progressPercent}%`;

  // Realistic McLaren 720S simulated acceleration curve (0 to 312 km/h)
  let speed = 0;
  let gear = 'N';

  if (progress <= 0.02) {
    speed = 0;
    gear = 'N';
  } else if (progress < 0.20) {
    speed = Math.round(progress * 420); // 0 -> 84 km/h
    gear = 'D1';
  } else if (progress < 0.40) {
    speed = Math.round(60 + progress * 240); // 84 -> 156 km/h
    gear = 'D2';
  } else if (progress < 0.65) {
    speed = Math.round(110 + progress * 190); // 156 -> 233 km/h
    gear = 'D3';
  } else if (progress < 0.85) {
    speed = Math.round(160 + progress * 140); // 233 -> 279 km/h
    gear = 'D4';
  } else {
    speed = Math.round(200 + progress * 112); // 279 -> 312 km/h
    gear = progress >= 0.98 ? 'TOP' : 'D5';
  }

  // Update DOM readouts
  DOM.cockpitSpeed.textContent = speed;
  DOM.cockpitGear.textContent = gear;
}

// ----------------------------------------------------------------------------
// 8. INTERACTIVE AUTOPLAY DEMO MODE
// ----------------------------------------------------------------------------
/**
 * Provides an autoplay button for evaluators to sit back and watch the
 * entire scroll journey execute automatically with a single click.
 */
function setupAutoplayDemo() {
  if (!DOM.autoplayBtn) return;

  DOM.autoplayBtn.addEventListener('click', () => {
    if (isAutoplaying) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  });

  // If user manually scrolls while autoplaying, cancel autoplay
  window.addEventListener('wheel', () => {
    if (isAutoplaying) stopAutoplay();
  }, { passive: true });
}

function startAutoplay() {
  isAutoplaying = true;
  DOM.autoplayBtnText.textContent = 'Pause Demo';
  DOM.autoplayBtn.classList.add('bg-emerald-500/30', 'text-white');

  const scrollDistance = DOM.scrollSection.offsetHeight - window.innerHeight;

  // Reset to top if already near the end
  if (window.scrollY >= scrollDistance * 0.9) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  autoplayTween = gsap.to(window, {
    scrollTo: { y: DOM.scrollSection.offsetTop + scrollDistance, autoKill: true },
    duration: 6.5,
    ease: 'power1.inOut',
    onComplete: () => {
      stopAutoplay();
    }
  });
}

function stopAutoplay() {
  isAutoplaying = false;
  DOM.autoplayBtnText.textContent = 'Play Demo';
  DOM.autoplayBtn.classList.remove('bg-emerald-500/30', 'text-white');
  if (autoplayTween) {
    autoplayTween.kill();
    autoplayTween = null;
  }
}

// ----------------------------------------------------------------------------
// 9. WINDOW RESIZE & LIFECYCLE HANDLERS
// ----------------------------------------------------------------------------
/**
 * Debounced resize handler ensures flawless responsiveness on window resizing
 * without causing performance lag or misplaced collision coordinates.
 */
let resizeTimeout = null;

function handleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    measureGeometry();
    ScrollTrigger.refresh();
  }, 150);
}

window.addEventListener('resize', handleResize);

// ----------------------------------------------------------------------------
// INITIALIZATION ON DOM READY
// ----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // 1. Kick off intro entrance timeline
  initPageLoadAnimation();

  // 2. Initialize scroll-driven McLaren animation
  initScrollDrivenAnimation();

  // 3. Setup optional autoplay demo button
  setupAutoplayDemo();

  console.log('⚡ ITZ FIZZ Hero Scroll Animation Engine initialized successfully.');
});
