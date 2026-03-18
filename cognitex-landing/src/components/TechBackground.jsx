import React, { useEffect, useRef } from 'react';

class Particle {
    constructor(canvas, isCyan) {
        this.canvas = canvas;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        this.baseSize = Math.random() * 1.5 + 0.5;
        this.size = this.baseSize;
        this.color = isCyan ? 'rgba(6, 182, 212, 1)' : 'rgba(59, 130, 246, 0.8)';
        
        // Neuron pulsing (breathing animation parameters)
        this.pulseAngle = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.02 + Math.random() * 0.05;
    }

    update(mouse, mouseDistance) {
        // Pulsing effect: neurons breathing
        this.pulseAngle += this.pulseSpeed;
        this.size = Math.max(0.1, this.baseSize + Math.sin(this.pulseAngle) * 0.6);

        this.x += this.vx;
        this.y += this.vy;

        // Bounce off walls smoothly
        if (this.x < 0 || this.x > this.canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > this.canvas.height) this.vy *= -1;

        // Interactive Neural Gravity (Attract to mouse, repel if too close)
        if (mouse.x != null) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance === 0) distance = 0.1; // Prevent division by zero
            
            if (distance < mouseDistance) {
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                
                if (distance < 80) {
                    // Repel zone: creates a ring (eye) around the cursor
                    this.vx -= forceDirectionX * 0.4;
                    this.vy -= forceDirectionY * 0.4;
                } else {
                    // Attract zone: creates neural density towards the cursor
                    this.vx += forceDirectionX * 0.03;
                    this.vy += forceDirectionY * 0.03;
                }
            }
        }

        // Friction to prevent infinite acceleration
        this.vx *= 0.98;
        this.vy *= 0.98;
        
        // Speed normalization
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed < 0.2) {
            // Keep them slowly drifting, never dead
            this.vx += (Math.random() - 0.5) * 0.1;
            this.vy += (Math.random() - 0.5) * 0.1;
        } else if (speed > 2.5) {
            // Speed limit to avoid erratic behavior
            this.vx = (this.vx / speed) * 2.5;
            this.vy = (this.vy / speed) * 2.5;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        
        // Add a slight glow to the neurons
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        
        ctx.globalAlpha = 0.9;
        ctx.fill();
        
        // Reset shadow for performance on non-glowing elements
        ctx.shadowBlur = 0;
    }
}

const TechBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const particles = [];
        const particleCount = 100; // High density for complex neural look
        const connectionDistance = 140; // Max distance for a synapse link
        const mouseDistance = 280; // Radius of cursor influence

        let mouse = { x: null, y: null };

        const handleMouseMove = (e) => {
            // Get mouse position relative to canvas
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };

        const handleMouseLeave = () => {
            mouse.x = null;
            mouse.y = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseout', handleMouseLeave);

        // Initialization
        for (let i = 0; i < particleCount; i++) {
            // 80% cyan, 20% blue to match the brand
            particles.push(new Particle(canvas, Math.random() > 0.2));
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw synapses (connections) and data sparks
            ctx.globalAlpha = 1;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    let dx = particles[i].x - particles[j].x;
                    let dy = particles[i].y - particles[j].y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < connectionDistance) {
                        // 1. Draw the actual Synapse Link
                        ctx.beginPath();
                        const opacity = Math.pow(1 - (distance / connectionDistance), 2); // Squared for smoother fade
                        ctx.strokeStyle = `rgba(6, 182, 212, ${opacity * 0.5})`; // Cyan neural link
                        ctx.lineWidth = opacity * 1.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();

                        // 2. Synapse Firing! Occasional data packets traveling between neurons
                        if (Math.random() < 0.003) { // Small chance per frame per connection
                            ctx.beginPath();
                            const sparkPos = Math.random(); // Random position traveling along the line
                            const sx = particles[i].x - dx * sparkPos;
                            const sy = particles[i].y - dy * sparkPos;
                            ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
                            ctx.fillStyle = '#ffffff'; // White hot data spark
                            ctx.shadowBlur = 10;
                            ctx.shadowColor = '#06b6d4';
                            ctx.fill();
                            ctx.shadowBlur = 0; // Reset
                        }
                    }
                }
            }

            // Update & Draw Neurons on top of connections
            particles.forEach(particle => {
                particle.update(mouse, mouseDistance);
                particle.draw(ctx);
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />;
};

export default TechBackground;
