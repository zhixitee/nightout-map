"use client";

import { useEffect, useRef } from 'react';
import { useTheme } from '@/lib/ThemeContext';
import styles from './ConstellationBackground.module.css';

interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  fadeDirection: number;
  fadeSpeed: number;
}

interface Constellation {
  stars: Star[];
  connections: [number, number][];
  opacity: number;
  fadeIn: boolean;
  lifetime: number;
  currentConnectionIndex: number;
  connectionProgress: number;
  fullyConnected: boolean;
}

const CONSTELLATION_PATTERNS = [
  // Orion-like
  {
    stars: [
      { x: 0.3, y: 0.2 },
      { x: 0.5, y: 0.25 },
      { x: 0.7, y: 0.2 },
      { x: 0.4, y: 0.5 },
      { x: 0.5, y: 0.5 },
      { x: 0.6, y: 0.5 },
      { x: 0.45, y: 0.8 },
      { x: 0.55, y: 0.8 },
    ],
    connections: [
      [0, 1], [1, 2], [1, 4], [3, 4], [4, 5], [4, 6], [4, 7]
    ],
  },
  // Big Dipper-like
  {
    stars: [
      { x: 0.2, y: 0.3 },
      { x: 0.3, y: 0.25 },
      { x: 0.45, y: 0.3 },
      { x: 0.6, y: 0.35 },
      { x: 0.65, y: 0.5 },
      { x: 0.55, y: 0.6 },
      { x: 0.4, y: 0.55 },
    ],
    connections: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]
    ],
  },
  // Triangle
  {
    stars: [
      { x: 0.3, y: 0.2 },
      { x: 0.7, y: 0.3 },
      { x: 0.5, y: 0.7 },
      { x: 0.5, y: 0.4 },
    ],
    connections: [
      [0, 1], [1, 2], [2, 0], [2, 3], [3, 1]
    ],
  },
  // W shape (Cassiopeia-like)
  {
    stars: [
      { x: 0.2, y: 0.4 },
      { x: 0.35, y: 0.25 },
      { x: 0.5, y: 0.35 },
      { x: 0.65, y: 0.2 },
      { x: 0.8, y: 0.35 },
    ],
    connections: [
      [0, 1], [1, 2], [2, 3], [3, 4]
    ],
  },
  // Cross
  {
    stars: [
      { x: 0.5, y: 0.2 },
      { x: 0.5, y: 0.5 },
      { x: 0.5, y: 0.8 },
      { x: 0.25, y: 0.5 },
      { x: 0.75, y: 0.5 },
    ],
    connections: [
      [0, 1], [1, 2], [3, 1], [1, 4]
    ],
  },
];

export default function ConstellationBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const constellationsRef = useRef<Constellation[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const createConstellation = (): Constellation => {
      const pattern = CONSTELLATION_PATTERNS[Math.floor(Math.random() * CONSTELLATION_PATTERNS.length)];
      const offsetX = Math.random() * canvas.width;
      const offsetY = Math.random() * canvas.height;
      const scale = 80 + Math.random() * 120;

      const stars: Star[] = pattern.stars.map(({ x, y }) => ({
        x: offsetX + x * scale,
        y: offsetY + y * scale,
        radius: 1 + Math.random() * 1.5,
        opacity: 0,
        fadeDirection: 1,
        fadeSpeed: 0.003 + Math.random() * 0.007,
      }));

      return {
        stars,
        connections: pattern.connections as [number, number][],
        opacity: 0,
        fadeIn: true,
        lifetime: 4000 + Math.random() * 4000,
        currentConnectionIndex: 0,
        connectionProgress: 0,
        fullyConnected: false,
      };
    };

    // Initialize with a few constellations
    constellationsRef.current = [
      createConstellation(),
      createConstellation(),
      createConstellation(),
      createConstellation(),
      createConstellation(),
      createConstellation(),
    ];

    let lastSpawnTime = Date.now();
    const spawnInterval = 1000;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = Date.now();

      // Spawn new constellation periodically
      if (now - lastSpawnTime > spawnInterval && constellationsRef.current.length < 15) {
        constellationsRef.current.push(createConstellation());
        lastSpawnTime = now;
      }

      constellationsRef.current = constellationsRef.current.filter((constellation) => {
        // Update fade and connection progress
        if (constellation.fadeIn) {
          constellation.opacity += 0.015;
          if (constellation.opacity >= 0.6) {
            constellation.fadeIn = false;
          }
        }

        // Animate connections one by one
        if (!constellation.fullyConnected) {
          constellation.connectionProgress += 0.03;
          
          if (constellation.connectionProgress >= 1) {
            constellation.connectionProgress = 0;
            constellation.currentConnectionIndex++;
            
            if (constellation.currentConnectionIndex >= constellation.connections.length) {
              constellation.fullyConnected = true;
              constellation.lifetime = now + 3000; // Start fade out after 3 seconds
            }
          }
        } else {
          // Fade out after fully connected
          if (now > constellation.lifetime) {
            constellation.opacity -= 0.012;
            if (constellation.opacity <= 0) {
              return false;
            }
          }
        }

        // Update star twinkle
        constellation.stars.forEach((star) => {
          star.opacity += star.fadeDirection * star.fadeSpeed;
          if (star.opacity >= 1) {
            star.opacity = 1;
            star.fadeDirection = -1;
          } else if (star.opacity <= 0.3) {
            star.opacity = 0.3;
            star.fadeDirection = 1;
          }
        });

        // Draw connections one by one
        ctx.strokeStyle = theme === 'dark' 
          ? `rgba(147, 197, 253, ${constellation.opacity * 0.5})` 
          : `rgba(99, 102, 241, ${constellation.opacity * 0.3})`;
        ctx.lineWidth = 1.5;

        // Draw completed connections
        for (let i = 0; i < constellation.currentConnectionIndex; i++) {
          const [start, end] = constellation.connections[i];
          const startStar = constellation.stars[start];
          const endStar = constellation.stars[end];
          if (startStar && endStar) {
            ctx.beginPath();
            ctx.moveTo(startStar.x, startStar.y);
            ctx.lineTo(endStar.x, endStar.y);
            ctx.stroke();
          }
        }

        // Draw current connection in progress
        if (!constellation.fullyConnected && constellation.currentConnectionIndex < constellation.connections.length) {
          const [start, end] = constellation.connections[constellation.currentConnectionIndex];
          const startStar = constellation.stars[start];
          const endStar = constellation.stars[end];
          if (startStar && endStar) {
            const progress = constellation.connectionProgress;
            const currentX = startStar.x + (endStar.x - startStar.x) * progress;
            const currentY = startStar.y + (endStar.y - startStar.y) * progress;
            
            ctx.beginPath();
            ctx.moveTo(startStar.x, startStar.y);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
          }
        }

        // Draw stars
        constellation.stars.forEach((star) => {
          ctx.fillStyle = theme === 'dark' 
            ? `rgba(191, 219, 254, ${constellation.opacity * star.opacity})` 
            : `rgba(129, 140, 248, ${constellation.opacity * star.opacity})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          ctx.fill();

          // Add glow
          const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 3);
          gradient.addColorStop(0, theme === 'dark' 
            ? `rgba(191, 219, 254, ${constellation.opacity * star.opacity * 0.4})` 
            : `rgba(129, 140, 248, ${constellation.opacity * star.opacity * 0.3})`);
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
          ctx.fill();
        });

        return true;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [theme]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}
