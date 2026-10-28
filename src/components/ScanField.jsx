import { useEffect, useRef } from 'react';

// Login page background: a slowly drifting network of hosts, scanned by a probe that follows
// the mouse. Hosts inside the probe light up blue, or red when they are vulnerable, and fade
// again after the probe has passed. Without the mouse the probe wanders on its own. Purely
// decorative; with "reduce motion" it draws one still frame.
// It fills its parent, which must be positioned, and listens to the mouse on that parent.

const LINK_DISTANCE = 120; // hosts closer than this are joined by a faint line
const PROBE_RADIUS = 150;
const VULNERABLE_SHARE = 0.12;
const FADE = 0.985; // how much of a host's glow is kept each frame

const BLUE = '96 165 250';
const RED = '248 113 113';
const GREY = '148 163 184';

export default function ScanField({ className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const area = canvas.parentElement;
    const context = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const probe = { x: 0, y: 0, targetX: 0, targetY: 0, following: false };
    let width = 0;
    let height = 0;
    let hosts = [];
    let frame = 0;

    function resize() {
      ({ width, height } = area.getBoundingClientRect());
      const ratio = window.devicePixelRatio || 1;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      // About one host per 9,000 px², so small and large screens look equally busy.
      hosts = Array.from({ length: Math.min(90, Math.round((width * height) / 9000)) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        vulnerable: Math.random() < VULNERABLE_SHARE,
        glow: 0,
      }));
      if (!probe.following) Object.assign(probe, { x: width * 0.65, y: height * 0.5 });
      if (reduceMotion) draw(0);
    }

    function moveProbe(time) {
      if (!probe.following) {
        probe.targetX = width * (0.6 + 0.25 * Math.sin(time / 4000));
        probe.targetY = height * (0.5 + 0.3 * Math.sin(time / 2900));
      }
      // Ease towards the target, so the probe glides instead of jumping.
      probe.x += (probe.targetX - probe.x) * 0.08;
      probe.y += (probe.targetY - probe.y) * 0.08;
    }

    function draw(time) {
      if (!reduceMotion) moveProbe(time);
      context.clearRect(0, 0, width, height);

      for (const host of hosts) {
        if (!reduceMotion) {
          host.x += host.vx;
          host.y += host.vy;
          if (host.x < 0 || host.x > width) host.vx *= -1;
          if (host.y < 0 || host.y > height) host.vy *= -1;
        }
        host.distance = Math.hypot(host.x - probe.x, host.y - probe.y);
        host.glow = host.distance < PROBE_RADIUS ? 1 : host.glow * FADE;
      }

      // The network.
      context.lineWidth = 1;
      for (let i = 0; i < hosts.length; i += 1) {
        for (let j = i + 1; j < hosts.length; j += 1) {
          const distance = Math.hypot(hosts[i].x - hosts[j].x, hosts[i].y - hosts[j].y);
          if (distance < LINK_DISTANCE) {
            context.strokeStyle = `rgb(${GREY} / ${0.12 * (1 - distance / LINK_DISTANCE)})`;
            context.beginPath();
            context.moveTo(hosts[i].x, hosts[i].y);
            context.lineTo(hosts[j].x, hosts[j].y);
            context.stroke();
          }
        }
      }

      // The probe: a soft glow, its edge, and a line to every host it is scanning.
      const glow = context.createRadialGradient(probe.x, probe.y, 0, probe.x, probe.y, PROBE_RADIUS);
      glow.addColorStop(0, `rgb(${BLUE} / 0.12)`);
      glow.addColorStop(1, `rgb(${BLUE} / 0)`);
      context.fillStyle = glow;
      context.beginPath();
      context.arc(probe.x, probe.y, PROBE_RADIUS, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = `rgb(${BLUE} / 0.2)`;
      context.stroke();

      for (const host of hosts) {
        if (host.distance >= PROBE_RADIUS) continue;
        context.strokeStyle = `rgb(${host.vulnerable ? RED : BLUE} / ${0.4 * (1 - host.distance / PROBE_RADIUS)})`;
        context.beginPath();
        context.moveTo(probe.x, probe.y);
        context.lineTo(host.x, host.y);
        context.stroke();
      }

      // The hosts: grey until scanned, then blue (or red with a halo when vulnerable).
      for (const host of hosts) {
        const colour = host.glow > 0.05 ? (host.vulnerable ? RED : BLUE) : GREY;
        context.fillStyle = `rgb(${colour} / ${0.45 + 0.55 * host.glow})`;
        context.beginPath();
        context.arc(host.x, host.y, 1.6 + 1.4 * host.glow, 0, Math.PI * 2);
        context.fill();
        if (host.vulnerable && host.glow > 0.05) {
          context.strokeStyle = `rgb(${RED} / ${0.45 * host.glow})`;
          context.beginPath();
          context.arc(host.x, host.y, 5 + 4 * (1 - host.glow), 0, Math.PI * 2);
          context.stroke();
        }
      }

      context.fillStyle = `rgb(${BLUE} / 0.9)`;
      context.beginPath();
      context.arc(probe.x, probe.y, 2.5, 0, Math.PI * 2);
      context.fill();

      if (!reduceMotion) frame = requestAnimationFrame(draw);
    }

    function follow(event) {
      const rect = area.getBoundingClientRect();
      Object.assign(probe, { targetX: event.clientX - rect.left, targetY: event.clientY - rect.top, following: true });
    }
    const wander = () => (probe.following = false);

    const observer = new ResizeObserver(resize);
    observer.observe(area);
    area.addEventListener('pointermove', follow);
    area.addEventListener('pointerleave', wander);
    if (!reduceMotion) frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      area.removeEventListener('pointermove', follow);
      area.removeEventListener('pointerleave', wander);
    };
  }, []);

  return <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 size-full ${className}`} aria-hidden="true" />;
}
