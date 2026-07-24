/**
 * Angry Cats Game Engine & Physics System
 */

// Sound Engine using Web Audio API Synthesizer
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playLaunch() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playImpact() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playExplosion() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  playDogHit() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }
}

const sounds = new SoundEngine();

// Particle System
class Particle {
  constructor(x, y, color, size, vx, vy, life) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.15; // Gravity on particles
    this.life--;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Cat Types
const CAT_TYPES = {
  RED: { name: 'Tom', type: 'RED', color: '#e63946', radius: 18, mass: 1, emoji: '🐱', speed: 1 },
  YELLOW: { name: 'Speedy', type: 'YELLOW', color: '#ffb703', radius: 16, mass: 0.9, emoji: '⚡', speed: 1.8 },
  BLACK: { name: 'Bomb', type: 'BLACK', color: '#2b2d42', radius: 22, mass: 1.5, emoji: '💣', speed: 1 },
  FAT: { name: 'Garfield', type: 'FAT', color: '#fb8500', radius: 28, mass: 3.0, emoji: '🦁', speed: 0.8 }
};

// Cat Entity
class Cat {
  constructor(x, y, catConfig) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.config = catConfig;
    this.radius = catConfig.radius;
    this.mass = catConfig.mass;
    this.launched = false;
    this.usedAbility = false;
    this.stopped = false;
    this.trail = [];
  }

  update(gravity) {
    if (!this.launched || this.stopped) return;

    this.vx *= 0.992; // Air resistance
    this.vy += gravity;
    this.x += this.vx;
    this.y += this.vy;

    // Record trail
    if (Math.random() < 0.3) {
      this.trail.push({ x: this.x, y: this.y, alpha: 0.8 });
    }
    this.trail.forEach(t => t.alpha -= 0.02);
    this.trail = this.trail.filter(t => t.alpha > 0);

    // Ground check
    if (this.y + this.radius >= 580) {
      this.y = 580 - this.radius;
      this.vy = -this.vy * 0.3; // Bounce
      this.vx *= 0.7;
      if (Math.abs(this.vx) < 0.2 && Math.abs(this.vy) < 0.2) {
        this.stopped = true;
      }
    }
  }

  useAbility() {
    if (!this.launched || this.usedAbility || this.stopped) return;
    this.usedAbility = true;

    if (this.config.type === 'YELLOW') {
      this.vx *= 2.2;
      this.vy *= 0.5;
      sounds.playLaunch();
    } else if (this.config.type === 'BLACK') {
      sounds.playExplosion();
      return true; // Explode trigger
    }
    return false;
  }

  draw(ctx) {
    // Draw trail
    this.trail.forEach(t => {
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle = this.config.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.save();
    ctx.translate(this.x, this.y);

    // Body gradient
    const grad = ctx.createRadialGradient(-3, -3, 2, 0, 0, this.radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, this.config.color);
    grad.addColorStop(1, '#000000');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    // Cat ears
    ctx.fillStyle = this.config.color;
    ctx.beginPath();
    ctx.moveTo(-this.radius * 0.7, -this.radius * 0.5);
    ctx.lineTo(-this.radius * 0.9, -this.radius * 1.2);
    ctx.lineTo(-this.radius * 0.2, -this.radius * 0.8);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(this.radius * 0.7, -this.radius * 0.5);
    ctx.lineTo(this.radius * 0.9, -this.radius * 1.2);
    ctx.lineTo(this.radius * 0.2, -this.radius * 0.8);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-this.radius * 0.3, -2, 5, 0, Math.PI * 2);
    ctx.arc(this.radius * 0.3, -2, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-this.radius * 0.3 + 1, -2, 2.5, 0, Math.PI * 2);
    ctx.arc(this.radius * 0.3 + 1, -2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Whiskers
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-this.radius * 0.4, 4); ctx.lineTo(-this.radius * 1.1, 2);
    ctx.moveTo(-this.radius * 0.4, 7); ctx.lineTo(-this.radius * 1.1, 9);
    ctx.moveTo(this.radius * 0.4, 4); ctx.lineTo(this.radius * 1.1, 2);
    ctx.moveTo(this.radius * 0.4, 7); ctx.lineTo(this.radius * 1.1, 9);
    ctx.stroke();

    ctx.restore();
  }
}

// Dog Entity (Pigs equivalent)
class Dog {
  constructor(x, y, radius = 20, hp = 100, isBoss = false) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = radius;
    this.hp = hp;
    this.maxHp = hp;
    this.isBoss = isBoss;
    this.alive = true;
  }

  update(gravity) {
    if (!this.alive) return;
    this.vx *= 0.98;
    this.vy += gravity;
    this.x += this.vx;
    this.y += this.vy;

    if (this.y + this.radius >= 580) {
      this.y = 580 - this.radius;
      this.vy = -this.vy * 0.2;
      this.vx *= 0.8;
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    sounds.playDogHit();
    if (this.hp <= 0) {
      this.alive = false;
    }
  }

  draw(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    // Dog body
    ctx.fillStyle = this.isBoss ? '#52796f' : '#8d5b4c';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#3d261d';
    ctx.stroke();

    // Snout
    ctx.fillStyle = '#d7bfa8';
    ctx.beginPath();
    ctx.ellipse(0, 4, this.radius * 0.5, this.radius * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dog Nose
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(0, 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.fillStyle = '#3d261d';
    ctx.beginPath();
    ctx.ellipse(-this.radius * 0.8, -this.radius * 0.4, 6, 12, Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(this.radius * 0.8, -this.radius * 0.4, 6, 12, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (X when low HP)
    if (this.hp < this.maxHp * 0.5) {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Eye X left
      ctx.moveTo(-8, -8); ctx.lineTo(-2, -2);
      ctx.moveTo(-2, -8); ctx.lineTo(-8, -2);
      // Eye X right
      ctx.moveTo(2, -8); ctx.lineTo(8, -2);
      ctx.moveTo(8, -8); ctx.lineTo(2, -2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-6, -5, 4, 0, Math.PI * 2);
      ctx.arc(6, -5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-6, -5, 2, 0, Math.PI * 2);
      ctx.arc(6, -5, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Boss Crown / Helmet
    if (this.isBoss) {
      ctx.fillStyle = '#ffb703';
      ctx.beginPath();
      ctx.moveTo(-12, -this.radius);
      ctx.lineTo(-15, -this.radius - 12);
      ctx.lineTo(-6, -this.radius - 6);
      ctx.lineTo(0, -this.radius - 14);
      ctx.lineTo(6, -this.radius - 6);
      ctx.lineTo(15, -this.radius - 12);
      ctx.lineTo(12, -this.radius);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}

// Destructible Block Entity
class Block {
  constructor(x, y, width, height, type = 'wood') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.vx = 0;
    this.vy = 0;

    const hpMap = { wood: 80, glass: 35, stone: 180, tnt: 10 };
    this.hp = hpMap[type] || 80;
    this.maxHp = this.hp;
    this.alive = true;
  }

  update(gravity) {
    if (!this.alive) return;
    this.vx *= 0.95;
    this.vy += gravity;
    this.x += this.vx;
    this.y += this.vy;

    if (this.y + this.height / 2 >= 580) {
      this.y = 580 - this.height / 2;
      this.vy = -this.vy * 0.1;
      this.vx *= 0.7;
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.alive = false;
      sounds.playImpact();
    }
  }

  draw(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'wood') {
      ctx.fillStyle = '#b07d4f';
      ctx.strokeStyle = '#6e4723';
    } else if (this.type === 'glass') {
      ctx.fillStyle = 'rgba(173, 216, 230, 0.7)';
      ctx.strokeStyle = '#4682b4';
    } else if (this.type === 'stone') {
      ctx.fillStyle = '#7f8c8d';
      ctx.strokeStyle = '#4b5563';
    } else if (this.type === 'tnt') {
      ctx.fillStyle = '#d90429';
      ctx.strokeStyle = '#800000';
    }

    ctx.lineWidth = 2;
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

    if (this.type === 'tnt') {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Fredoka One, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TNT', 0, 0);
    }

    ctx.restore();
  }
}
