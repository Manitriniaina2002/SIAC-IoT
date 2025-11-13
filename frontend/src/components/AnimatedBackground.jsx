import React, { useEffect, useRef } from 'react'

export default function AnimatedBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationFrameId
    let particles = []
    let connections = []

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Particle class representing IoT nodes
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.vx = (Math.random() - 0.5) * 0.5
        this.vy = (Math.random() - 0.5) * 0.5
        this.radius = Math.random() * 2 + 1
        this.color = Math.random() > 0.5 ? '#7F0202' : '#311156'
        this.pulse = Math.random() * Math.PI * 2
      }

      update() {
        this.x += this.vx
        this.y += this.vy
        this.pulse += 0.03

        // Bounce off edges
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1

        // Keep within bounds
        this.x = Math.max(0, Math.min(canvas.width, this.x))
        this.y = Math.max(0, Math.min(canvas.height, this.y))
      }

      draw() {
        const pulseSize = this.radius + Math.sin(this.pulse) * 0.5
        
        // Outer glow
        ctx.beginPath()
        ctx.arc(this.x, this.y, pulseSize * 2, 0, Math.PI * 2)
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, pulseSize * 2)
        gradient.addColorStop(0, this.color + '40')
        gradient.addColorStop(1, this.color + '00')
        ctx.fillStyle = gradient
        ctx.fill()

        // Inner particle
        ctx.beginPath()
        ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2)
        ctx.fillStyle = this.color
        ctx.fill()
      }
    }

    // Initialize particles
    const particleCount = Math.min(80, Math.floor(canvas.width * canvas.height / 10000))
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    // Animation loop
    const animate = () => {
      // Semi-transparent background for trail effect
      ctx.fillStyle = 'rgba(255, 250, 250, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particles.forEach(particle => {
        particle.update()
        particle.draw()
      })

      // Draw connections between nearby particles
      ctx.strokeStyle = 'rgba(127, 2, 2, 0.15)'
      ctx.lineWidth = 0.5
      
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.globalAlpha = 1 - distance / 150
            ctx.stroke()
            ctx.globalAlpha = 1

            // Draw data packet animation along connection
            if (Math.random() > 0.99) {
              const t = Math.random()
              const px = particles[i].x + (particles[j].x - particles[i].x) * t
              const py = particles[i].y + (particles[j].y - particles[i].y) * t
              
              ctx.beginPath()
              ctx.arc(px, py, 2, 0, Math.PI * 2)
              ctx.fillStyle = '#7F0202'
              ctx.fill()
            }
          }
        }
      }

      // Draw security shield icons at random positions
      if (Math.random() > 0.98) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        drawSecurityIcon(x, y)
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    // Draw security shield icon
    const drawSecurityIcon = (x, y) => {
      ctx.save()
      ctx.translate(x, y)
      
      // Shield shape
      ctx.beginPath()
      ctx.moveTo(0, -8)
      ctx.lineTo(6, -6)
      ctx.lineTo(6, 2)
      ctx.quadraticCurveTo(6, 6, 0, 8)
      ctx.quadraticCurveTo(-6, 6, -6, 2)
      ctx.lineTo(-6, -6)
      ctx.closePath()
      
      ctx.fillStyle = 'rgba(127, 2, 2, 0.3)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(127, 2, 2, 0.6)'
      ctx.lineWidth = 1
      ctx.stroke()
      
      // Lock symbol
      ctx.beginPath()
      ctx.arc(0, 0, 2, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(127, 2, 2, 0.8)'
      ctx.fill()
      
      ctx.restore()
    }

    // Start animation
    animate()

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        background: 'linear-gradient(135deg, #fff5f5 0%, #ffe5e5 25%, #fff0f0 50%, #ffe8e8 75%, #fff5f5 100%)',
        zIndex: 0
      }}
    />
  )
}
