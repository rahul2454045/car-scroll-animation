# React & Next.js Implementation Guide

This folder contains the React / Next.js implementation of the **Scroll-Driven Supercar Hero Section Animation**.

## Installation

Install the required dependencies in your Next.js or React project:

```bash
npm install gsap
# or
yarn add gsap
# or
pnpm add gsap
```

## How to Use in Next.js (App Router)

1. Place `assets/car.png` into your Next.js `public/assets/car.png` folder.
2. Copy `HeroScrollAnimation.jsx` into your `components/` directory (e.g., `components/HeroScrollAnimation.jsx`).
3. Import and render it in your page:

```jsx
// app/page.jsx
import HeroScrollAnimation from '@/components/HeroScrollAnimation';

export default function Page() {
  return (
    <main>
      <HeroScrollAnimation />
    </main>
  );
}
```

Note: The component has `'use client';` directive included at the top, making it compatible with Next.js App Router (SSR-safe).
