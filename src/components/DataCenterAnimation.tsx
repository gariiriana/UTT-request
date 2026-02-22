import { useEffect, useRef } from 'react';

export function DataCenterAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle class for data flow
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;

      constructor(canvasWidth: number, _canvasHeight: number) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * _canvasHeight;
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.3;
      }

      update(canvasWidth: number, canvasHeight: number) {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > canvasWidth) this.speedX *= -1;
        if (this.y < 0 || this.y > canvasHeight) this.speedY *= -1;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = `rgba(59, 130, 246, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Network node class
    class NetworkNode {
      x: number;
      y: number;
      radius: number;
      pulsePhase: number;

      constructor(canvasWidth: number, canvasHeight: number) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.radius = Math.random() * 3 + 2;
        this.pulsePhase = Math.random() * Math.PI * 2;
      }

      update() {
        this.pulsePhase += 0.02;
      }

      draw(ctx: CanvasRenderingContext2D) {
        const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(147, 51, 234, ${pulse * 0.6})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Outer glow
        ctx.strokeStyle = `rgba(147, 51, 234, ${pulse * 0.3})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Data stream class
    class DataStream {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
      angle: number;

      constructor(canvasWidth: number, _canvasHeight: number) {
        this.x = Math.random() * canvasWidth;
        this.y = -10;
        this.length = Math.random() * 100 + 50;
        this.speed = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.3 + 0.2;
        this.angle = Math.random() * 0.2 - 0.1;
      }

      update(_canvasHeight: number) {
        this.y += this.speed;
        this.x += Math.sin(this.angle) * 0.5;
      }

      draw(ctx: CanvasRenderingContext2D) {
        const gradient = ctx.createLinearGradient(
          this.x,
          this.y,
          this.x,
          this.y + this.length
        );
        gradient.addColorStop(0, `rgba(59, 130, 246, 0)`);
        gradient.addColorStop(0.5, `rgba(59, 130, 246, ${this.opacity})`);
        gradient.addColorStop(1, `rgba(59, 130, 246, 0)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.length);
        ctx.stroke();
      }

      isOffScreen(canvasHeight: number): boolean {
        return this.y > canvasHeight + this.length;
      }
    }

    // Initialize particles
    const particles: Particle[] = [];
    const particleCount = 80;
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(canvas.width, canvas.height));
    }

    // Initialize network nodes
    const nodes: NetworkNode[] = [];
    const nodeCount = 15;
    for (let i = 0; i < nodeCount; i++) {
      nodes.push(new NetworkNode(canvas.width, canvas.height));
    }

    // Initialize data streams
    const dataStreams: DataStream[] = [];

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((particle) => {
        particle.update(canvas.width, canvas.height);
        particle.draw(ctx);
      });

      // Draw connections between close particles
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.strokeStyle = `rgba(59, 130, 246, ${(1 - distance / 150) * 0.15})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

      // Update and draw network nodes
      nodes.forEach((node) => {
        node.update();
        node.draw(ctx);
      });

      // Update and draw data streams
      if (Math.random() < 0.03 && dataStreams.length < 10) {
        dataStreams.push(new DataStream(canvas.width, canvas.height));
      }

      dataStreams.forEach((stream, index) => {
        stream.update(canvas.height);
        stream.draw(ctx);

        if (stream.isOffScreen(canvas.height)) {
          dataStreams.splice(index, 1);
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}
    />
  );
}
