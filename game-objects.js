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
assets.loadImage('cat_red', 'assets/cat_red.png');
assets.loadImage('cat_yellow', 'assets/cat_yellow.png');
assets.loadImage('cat_black', 'assets/cat_black.png');
assets.loadImage('dog', 'assets/dog.png');
assets.loadImage('bg', 'assets/bg.png');
assets.loadImage('cats_sheet', 'assets/cats_sheet.png');
assets.loadImage('dogs_sheet', 'assets/dogs_sheet.png');
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

// Cat Types Configuration
const CAT_TYPES = {
  RED: { name: 'Tom', type: 'RED', color: '#e63946', radius: 22, mass: 1.0, sprite: 'cat_red' },
  YELLOW: { name: 'Speedy', type: 'YELLOW', color: '#ffb703', radius: 20, mass: 0.85, sprite: 'cat_yellow' },
  BLACK: { name: 'Bomb', type: 'BLACK', color: '#2b2d42', radius: 25, mass: 1.6, sprite: 'cat_black' },
  FAT: { name: 'Garfield', type: 'FAT', color: '#fb8500', radius: 32, mass: 3.2, sprite: 'cat_red' }
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

  update(gravity) {
    if (!this.alive) return;
    this.vx *= 0.98;
    this.vy += gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.angle += this.vx * 0.03;

    if (this.y + this.radius >= 570) {
      this.y = 570 - this.radius;
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
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.vAngle = 0;

    const hpMap = { wood: 90, glass: 40, stone: 200, tnt: 15 };
    this.hp = hpMap[type] || 90;
    this.maxHp = this.hp;
    this.alive = true;
  }

  update(gravity) {
    if (!this.alive) return;
    this.vx *= 0.96;
    this.vy += gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.angle += this.vAngle;
    this.vAngle *= 0.95;

    if (this.y + this.height / 2 >= 570) {
      this.y = 570 - this.height / 2;
      this.vy = -this.vy * 0.15;
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
    ctx.rotate(this.angle);

    if (this.type === 'wood') {
      ctx.fillStyle = '#b07d4f';
      ctx.strokeStyle = '#4a2c11';
    } else if (this.type === 'glass') {
      ctx.fillStyle = 'rgba(173, 216, 230, 0.75)';
      ctx.strokeStyle = '#2b5876';
    } else if (this.type === 'stone') {
      ctx.fillStyle = '#7f8c8d';
      ctx.strokeStyle = '#2c3e50';
    } else if (this.type === 'tnt') {
      ctx.fillStyle = '#e63946';
      ctx.strokeStyle = '#800000';
    }

    ctx.lineWidth = 3.5;
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

    const damagePercent = 1 - (this.hp / this.maxHp);
    if (damagePercent > 0.3) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-this.width * 0.3, -this.height * 0.3);
      ctx.lineTo(this.width * 0.2, this.height * 0.1);
      ctx.lineTo(-this.width * 0.1, this.height * 0.4);
      ctx.stroke();
    }

    if (this.type === 'tnt') {
      ctx.fillStyle = '#fff';
      ctx.font = '900 13px "Fredoka One", cursive, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TNT 💣', 0, 0);
    }

    ctx.restore();
  }
}

