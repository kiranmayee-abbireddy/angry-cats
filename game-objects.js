/**
 * Angry Cats Vector & Sprite Renderer - 100% Cohesive Angry Birds Aesthetic
 */

// Asset Manager
class AssetManager {
  constructor() {
    this.images = {};
  }

  loadImage(key, src) {
    const img = new Image();
    img.src = src;
    this.images[key] = img;
  }

  getImage(key) {
    return this.images[key];
  }
}

const assets = new AssetManager();
assets.loadImage('cat_red', 'assets/red.svg');
assets.loadImage('cat_yellow', 'assets/yellow.svg');
assets.loadImage('cat_black', 'assets/black.svg');
assets.loadImage('cat_orange', 'assets/orange.svg');
assets.loadImage('dog', 'assets/dog.svg');
assets.loadImage('slingshot', 'assets/slingshot.svg');
assets.loadImage('bg', 'assets/bg.png');
assets.loadImage('wood_banner', 'assets/wood_banner.png');

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
    osc.frequency.exponentialRampToValueAtTime(550, this.ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  playImpact() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 0.22);
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  playExplosion() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(15, this.ctx.currentTime + 0.45);
    gain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.45);
  }

  playDogHit() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(180, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }
}

const sounds = new SoundEngine();

// Floating Text Score Popups
class FloatingText {
  constructor(text, x, y, color = '#ffb703') {
    this.text = text;
    this.x = x;
    this.y = y;
    this.color = color;
    this.alpha = 1;
    this.vy = -1.5;
  }

  update() {
    this.y += this.vy;
    this.alpha -= 0.02;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.font = '900 22px "Fredoka One", cursive, sans-serif';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

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
    this.rotation = Math.random() * Math.PI * 2;
    this.vRot = (Math.random() - 0.5) * 0.2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.15;
    this.rotation += this.vRot;
    this.life--;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    ctx.restore();
  }
}

/**
 * Debris Chunk — an Angry Birds-style tumbling piece that flies out
 * when a block is destroyed. Has material-specific texture and bounces
 * off the ground before fading away.
 */
class Debris {
  constructor(x, y, w, h, material, vx, vy, vAngle) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.material = material; // 'wood' | 'glass' | 'stone' | 'tnt'
    this.vx = vx;
    this.vy = vy;
    this.angle = Math.random() * Math.PI * 2;
    this.vAngle = vAngle;
    this.life = 140 + Math.random() * 60;
    this.maxLife = this.life;
    this.bounces = 0;
  }

  update(gravity) {
    this.vx *= 0.985;
    this.vy += gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.angle += this.vAngle;
    this.vAngle *= 0.97;
    this.life--;

    // Bounce off ground
    if (this.y + this.h / 2 >= 570 && this.bounces < 3) {
      this.y = 570 - this.h / 2;
      this.vy = -this.vy * (0.35 - this.bounces * 0.1);
      this.vx *= 0.72;
      this.vAngle *= 0.55;
      this.bounces++;
      if (Math.abs(this.vy) < 0.8) this.vy = 0;
    } else if (this.y + this.h / 2 >= 570) {
      this.y = 570 - this.h / 2;
      this.vy = 0;
      this.vx *= 0.88;
      this.vAngle *= 0.3;
    }
  }

  draw(ctx) {
    if (this.life <= 0) return;
    // Fade out in last 40 frames
    const alpha = this.life < 40 ? this.life / 40 : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const w2 = this.w / 2;
    const h2 = this.h / 2;

    // Fill per material
    if (this.material === 'wood') {
      ctx.fillStyle = '#9e6535';
      ctx.strokeStyle = '#3a1e08';
    } else if (this.material === 'glass') {
      ctx.fillStyle = 'rgba(160, 215, 235, 0.88)';
      ctx.strokeStyle = '#1a6890';
    } else if (this.material === 'stone') {
      ctx.fillStyle = '#8a8a8a';
      ctx.strokeStyle = '#333';
    } else { // tnt
      ctx.fillStyle = '#e63946';
      ctx.strokeStyle = '#800000';
    }

    ctx.lineWidth = 1.5;
    ctx.fillRect(-w2, -h2, this.w, this.h);
    ctx.strokeRect(-w2, -h2, this.w, this.h);

    // Material texture detail
    if (this.material === 'wood') {
      // Wood grain
      ctx.strokeStyle = 'rgba(58,30,8,0.4)';
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(-w2 + 2, -h2); ctx.lineTo(-w2,  h2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo( w2 * 0.2, -h2); ctx.lineTo( w2 * 0.1, h2); ctx.stroke();
    } else if (this.material === 'glass') {
      // Glass shimmer triangle
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.moveTo(-w2 + 2, -h2 + 2);
      ctx.lineTo(w2 * 0.3, -h2 + 2);
      ctx.lineTo(-w2 + 2,  h2 * 0.3);
      ctx.closePath();
      ctx.fill();
    } else if (this.material === 'stone') {
      // Stone pebble dot
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.arc(w2 * 0.25, -h2 * 0.2, Math.min(w2, h2) * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// Cat Types Configuration mapping to SVG files
const CAT_TYPES = {
  RED: { name: 'Tom', type: 'RED', color: '#e63946', radius: 22, mass: 1.0, sprite: 'cat_red' },
  YELLOW: { name: 'Speedy', type: 'YELLOW', color: '#ffb703', radius: 20, mass: 0.85, sprite: 'cat_yellow' },
  BLACK: { name: 'Bomb', type: 'BLACK', color: '#2b2d42', radius: 25, mass: 1.6, sprite: 'cat_black' },
  FAT: { name: 'Garfield', type: 'FAT', color: '#fb8500', radius: 32, mass: 3.2, sprite: 'cat_orange' }
};

// Unified Cat Entity using Generated Image Sprites
class Cat {
  constructor(x, y, catConfig) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
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

    this.vx *= 0.993;
    this.vy += gravity;
    this.x += this.vx;
    this.y += this.vy;

    this.angle += this.vx * 0.04;

    if (Math.random() < 0.4) {
      this.trail.push({ x: this.x, y: this.y, alpha: 0.8, r: this.radius * 0.4 });
    }
    this.trail.forEach(t => t.alpha -= 0.03);
    this.trail = this.trail.filter(t => t.alpha > 0);

    if (this.y + this.radius >= 570) {
      this.y = 570 - this.radius;
      this.vy = -this.vy * 0.35;
      this.vx *= 0.75;
      if (Math.abs(this.vx) < 0.2 && Math.abs(this.vy) < 0.2) {
        this.stopped = true;
      }
    }
  }

  useAbility() {
    if (!this.launched || this.usedAbility || this.stopped) return false;
    this.usedAbility = true;

    if (this.config.type === 'YELLOW') {
      this.vx *= 2.4;
      this.vy *= 0.3;
      sounds.playLaunch();
      return 'BOOST';
    } else if (this.config.type === 'BLACK') {
      sounds.playExplosion();
      return 'EXPLODE';
    }
    return false;
  }

  draw(ctx) {
    // Draw trail smoke
    this.trail.forEach(t => {
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle = this.config.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const r = this.radius;
    const img = assets.getImage(this.config.sprite) || assets.getImage('cat_red');

    if (img && img.complete && img.naturalWidth !== 0) {
      // Draw Image Sprite directly
      ctx.drawImage(img, -r * 1.25, -r * 1.25, r * 2.5, r * 2.5);
    } else {
      // Vector backup
      ctx.fillStyle = this.config.color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }
}

// Unified Dog Entity using Generated Image Sprites
class Dog {
  constructor(x, y, radius = 22, hp = 100, isBoss = false) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.radius = radius;
    this.hp = hp;
    this.maxHp = hp;
    this.isBoss = isBoss;
    this.alive = true;
  }

  update(gravity, blocks = [], otherDogs = []) {
    if (!this.alive) return;
    this.vx *= 0.98;
    this.vy += gravity;

    const nextX = this.x + this.vx;
    const nextY = this.y + this.vy;

    // 1. Check support on top of horizontal blocks & side walls
    let supported = false;
    for (const b of blocks) {
      if (!b.alive) continue;
      const bTop = b.y - b.height / 2;
      const bBottom = b.y + b.height / 2;
      const bLeft = b.x - b.width / 2;
      const bRight = b.x + b.width / 2;

      // Check top support
      if (nextX >= bLeft - this.radius * 0.8 && nextX <= bRight + this.radius * 0.8 &&
          this.y + this.radius <= bTop + 12 && nextY + this.radius >= bTop) {
        this.y = bTop - this.radius;
        this.vy = 0;
        this.vx *= 0.85;
        supported = true;
        break;
      }

      // Check side collisions with vertical pillars
      if (this.y + this.radius > bTop + 4 && this.y - this.radius < bBottom - 4) {
        if (this.x < bLeft && nextX + this.radius >= bLeft) {
          this.x = bLeft - this.radius;
          this.vx = -Math.abs(this.vx) * 0.4;
        } else if (this.x > bRight && nextX - this.radius <= bRight) {
          this.x = bRight + this.radius;
          this.vx = Math.abs(this.vx) * 0.4;
        }
      }
    }

    // 2. Dog-to-Dog collision resolution (prevent overlapping / allow stacking)
    for (const other of otherDogs) {
      if (other === this || !other.alive) continue;
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = Math.hypot(dx, dy);
      const minDist = this.radius + other.radius;

      if (dist < minDist && dist > 0) {
        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;

        // Separate dogs along collision normal
        this.x += nx * overlap * 0.5;
        this.y += ny * overlap * 0.5;

        // Velocity transfer
        const kx = this.vx - other.vx;
        const ky = this.vy - other.vy;
        const p = 2 * (nx * kx + ny * ky) / 2;
        this.vx -= p * nx * 0.5;
        this.vy -= p * ny * 0.5;

        // Stacking support check (if standing on top of another dog)
        if (ny < -0.7) {
          supported = true;
          this.vy = 0;
        }
      }
    }

    if (!supported) {
      this.x += this.vx;
      this.y += this.vy;
      this.angle += this.vx * 0.03;

      if (this.y + this.radius >= 570) {
        this.y = 570 - this.radius;
        this.vy = -this.vy * 0.2;
        this.vx *= 0.8;
      }
    } else {
      this.x += this.vx;
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
    ctx.rotate(this.angle);

    const r = this.radius;
    const img = assets.getImage('dog');

    if (img && img.complete && img.naturalWidth !== 0) {
      // Draw Generated Dog Image Asset
      ctx.drawImage(img, -r * 1.25, -r * 1.25, r * 2.5, r * 2.5);

      if (this.isBoss) {
        ctx.fillStyle = '#ffb703';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-r * 0.6, -r * 0.85);
        ctx.lineTo(-r * 0.8, -r * 1.45);
        ctx.lineTo(-r * 0.3, -r * 1.1);
        ctx.lineTo(0, -r * 1.6);
        ctx.lineTo(r * 0.3, -r * 1.1);
        ctx.lineTo(r * 0.8, -r * 1.45);
        ctx.lineTo(r * 0.6, -r * 0.85);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#76c893';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// Destructible Physics Block Entity
class Block {
  constructor(x, y, width, height, type = 'wood') {
    this.x      = x;
    this.y      = y;
    this.width  = width;
    this.height = height;
    this.type   = type;
    this.vx     = 0;
    this.vy     = 0;
    this.angle  = 0;
    this.vAngle = 0;

    // Balanced HP per material
    const hpMap   = { wood: 120, glass: 30, stone: 280, tnt: 12 };
    // Realistic mass: stone >> wood > tnt > glass
    const massMap = { wood: 1.2, glass: 0.65, stone: 3.2, tnt: 0.9 };
    this.hp       = hpMap[type]   || 120;
    this.maxHp    = this.hp;
    this.mass     = massMap[type] || 1.2;
    this.alive    = true;

    // Sleeping system — blocks start fully settled; only wake when disturbed
    this.sleeping   = true;
    this.sleepTimer = 0;
  }

  /** Wake this block so physics kicks in. */
  wakeUp() {
    this.sleeping   = false;
    this.sleepTimer = 0;
  }

  update(gravity, otherBlocks = []) {
    if (!this.alive) return;

    // Dampen horizontal velocity (friction differs by material)
    const friction = this.type === 'stone' ? 0.94 : this.type === 'glass' ? 0.97 : 0.95;
    this.vx *= friction;
    this.vy += gravity;

    let supported = false;

    // --- Vertical support: ground ---
    if (this.y + this.height / 2 + this.vy >= 570) {
      this.y = 570 - this.height / 2;
      this.vy = -this.vy * 0.15; // very little bounce
      this.vx *= 0.65;           // ground friction
      this.vAngle *= 0.5;
      if (Math.abs(this.vy) < 0.5) this.vy = 0;
      supported = true;
    }

    if (!supported) {
      // --- Block-on-block vertical support ---
      for (const b of otherBlocks) {
        if (b === this || !b.alive) continue;
        const bTop    = b.y - b.height / 2;
        const bLeft   = b.x - b.width  / 2;
        const bRight  = b.x + b.width  / 2;
        const myLeft  = this.x - this.width  / 2;
        const myRight = this.x + this.width  / 2;
        const myBot   = this.y + this.height / 2;

        // X overlap test
        const xOverlap = myRight > bLeft + 2 && myLeft < bRight - 2;
        // Falling onto top of block
        if (xOverlap && myBot <= bTop + 8 && myBot + this.vy >= bTop) {
          this.y = bTop - this.height / 2;
          this.vy = -this.vy * 0.1;
          this.vx *= 0.75;
          this.vAngle *= 0.5;
          if (Math.abs(this.vy) < 0.5) this.vy = 0;
          supported = true;
          break;
        }
      }
    }

    // Apply movement
    if (supported) {
      // Still slide horizontally even when supported
      if (Math.abs(this.vx) > 0.1) this.x += this.vx;
      // Settle angle when resting
      this.angle *= 0.85;
      this.vAngle *= 0.7;
    } else {
      this.x += this.vx;
      this.y += this.vy;
      this.angle += this.vAngle;
      this.vAngle *= 0.95;
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.wakeUp(); // any damage wakes the block
    if (this.hp <= 0) {
      this.alive = false;
      sounds.playImpact();
    }
  }

  draw(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const w2 = this.width / 2;
    const h2 = this.height / 2;
    const dmg = 1 - (this.hp / this.maxHp); // 0 = full HP, 1 = dead

    // --- Fill & stroke per material ---
    if (this.type === 'wood') {
      // Wood: warm brown, darkens with damage
      const r = Math.round(176 - dmg * 80);
      const g = Math.round(125 - dmg * 60);
      const b = Math.round(79  - dmg * 40);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.strokeStyle = '#3a1e08';
    } else if (this.type === 'glass') {
      // Glass: icy blue, becomes more opaque/dark when damaged
      const alpha = 0.65 + dmg * 0.25;
      const tint = Math.round(180 - dmg * 80);
      ctx.fillStyle = `rgba(${tint}, ${Math.round(220 - dmg*60)}, 240, ${alpha})`;
      ctx.strokeStyle = '#1a6890';
    } else if (this.type === 'stone') {
      // Stone: grey, cracks show as dark veins
      const v = Math.round(130 - dmg * 60);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.strokeStyle = '#1a1a2e';
    } else if (this.type === 'tnt') {
      ctx.fillStyle = dmg > 0.5 ? '#ff6b35' : '#e63946';
      ctx.strokeStyle = '#800000';
    }

    ctx.lineWidth = 3;
    ctx.fillRect(-w2, -h2, this.width, this.height);
    ctx.strokeRect(-w2, -h2, this.width, this.height);

    // --- Damage cracks ---
    if (dmg > 0.2) {
      ctx.save();
      const crackAlpha = Math.min(1, dmg * 1.3);
      if (this.type === 'glass') {
        ctx.strokeStyle = `rgba(255,255,255,${crackAlpha})`;
      } else {
        ctx.strokeStyle = `rgba(0,0,0,${crackAlpha * 0.85})`;
      }
      ctx.lineWidth = dmg > 0.5 ? 2.5 : 1.5;
      // Crack 1
      ctx.beginPath();
      ctx.moveTo(-w2 * 0.6, -h2 * 0.5);
      ctx.lineTo(w2 * 0.1,   h2 * 0.3);
      ctx.stroke();
      if (dmg > 0.45) {
        // Crack 2
        ctx.beginPath();
        ctx.moveTo(w2 * 0.4,  -h2 * 0.8);
        ctx.lineTo(-w2 * 0.2,  h2 * 0.6);
        ctx.stroke();
        // Crack branch
        ctx.beginPath();
        ctx.moveTo(w2 * 0.1, h2 * 0.3);
        ctx.lineTo(w2 * 0.55, h2 * 0.1);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Glass shimmer highlight
    if (this.type === 'glass') {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(-w2 + 3, -h2 + 3, this.width * 0.35, this.height * 0.35);
    }

    // Wood grain lines
    if (this.type === 'wood') {
      ctx.strokeStyle = 'rgba(58,30,8,0.35)';
      ctx.lineWidth = 1.2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * w2 * 0.5, -h2);
        ctx.lineTo(i * w2 * 0.4,  h2);
        ctx.stroke();
      }
    }

    // Stone texture dots
    if (this.type === 'stone') {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      [[w2*0.3, -h2*0.3], [-w2*0.4, h2*0.2], [w2*0.1, h2*0.4]].forEach(([px, py]) => {
        ctx.beginPath();
        ctx.arc(px, py, Math.min(w2, h2) * 0.2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (this.type === 'tnt') {
      ctx.fillStyle = '#fff';
      ctx.font = `900 ${Math.min(13, this.width * 0.35)}px "Fredoka One", cursive, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TNT 💣', 0, 0);
    }

    ctx.restore();
  }
}

