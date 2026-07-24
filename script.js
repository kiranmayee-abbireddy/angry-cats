/**
 * Main Game Controller and Slingshot Logic
 */

class GameApp {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.gravity = 0.35;

    // Slingshot anchor
    this.slingPos = { x: 180, y: 470 };

    // Game states
    this.cats = [];
    this.activeCatIndex = 0;
    this.currentCat = null;
    this.dogs = [];
    this.blocks = [];
    this.particles = [];

    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('angry_cats_highscore') || '0');
    this.currentLevel = 1;
    this.isDragging = false;
    this.dragPos = { x: this.slingPos.x, y: this.slingPos.y };

    this.setupUIListeners();
    this.loadLevel(1);
    this.gameLoop = this.gameLoop.bind(this);
    requestAnimationFrame(this.gameLoop);
  }

  setupUIListeners() {
    // Sound Button
    const btnSound = document.getElementById('btn-sound');
    btnSound.addEventListener('click', () => {
      sounds.enabled = !sounds.enabled;
      btnSound.textContent = sounds.enabled ? '🔊' : '🔇';
    });

    // Restart Button
    document.getElementById('btn-restart').addEventListener('click', () => this.loadLevel(this.currentLevel));
    document.getElementById('btn-retry-level').addEventListener('click', () => {
      document.getElementById('modal-end').classList.add('hidden');
      this.loadLevel(this.currentLevel);
    });

    // Level Select Modal
    const modalLevels = document.getElementById('modal-levels');
    document.getElementById('btn-select-level').addEventListener('click', () => modalLevels.classList.remove('hidden'));
    document.getElementById('btn-close-levels').addEventListener('click', () => modalLevels.classList.add('hidden'));

    document.querySelectorAll('.level-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lvl = parseInt(e.currentTarget.getAttribute('data-level'));
        document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.loadLevel(lvl);
        modalLevels.classList.add('hidden');
      });
    });

    // Start Modal
    document.getElementById('btn-start-game').addEventListener('click', () => {
      document.getElementById('modal-start').classList.add('hidden');
      sounds.init();
    });

    // Next Level Button
    document.getElementById('btn-next-level').addEventListener('click', () => {
      document.getElementById('modal-end').classList.add('hidden');
      const nextLvl = (this.currentLevel % 3) + 1;
      this.loadLevel(nextLvl);
    });

    // Canvas Mouse / Touch events for Slingshot & Abilities
    const handleDown = (x, y) => {
      if (this.currentCat && !this.currentCat.launched) {
        const dist = Math.hypot(x - this.slingPos.x, y - this.slingPos.y);
        if (dist < 60) {
          this.isDragging = true;
        }
      } else if (this.currentCat && this.currentCat.launched && !this.currentCat.usedAbility) {
        const exploded = this.currentCat.useAbility();
        if (exploded) {
          this.triggerExplosion(this.currentCat.x, this.currentCat.y, 110, 150);
          this.currentCat.stopped = true;
        }
      }
    };

    const handleMove = (x, y) => {
      if (!this.isDragging) return;
      const maxPull = 110;
      const dx = x - this.slingPos.x;
      const dy = y - this.slingPos.y;
      const dist = Math.hypot(dx, dy);

      if (dist > maxPull) {
        const angle = Math.atan2(dy, dx);
        this.dragPos.x = this.slingPos.x + Math.cos(angle) * maxPull;
        this.dragPos.y = this.slingPos.y + Math.sin(angle) * maxPull;
      } else {
        this.dragPos.x = x;
        this.dragPos.y = y;
      }

      if (this.currentCat) {
        this.currentCat.x = this.dragPos.x;
        this.currentCat.y = this.dragPos.y;
      }
    };

    const handleUp = () => {
      if (this.isDragging && this.currentCat) {
        this.isDragging = false;
        sounds.playLaunch();

        const dx = this.slingPos.x - this.dragPos.x;
        const dy = this.slingPos.y - this.dragPos.y;
        this.currentCat.vx = dx * 0.18;
        this.currentCat.vy = dy * 0.18;
        this.currentCat.launched = true;

        document.getElementById('ability-hint').classList.remove('hidden');
        setTimeout(() => document.getElementById('ability-hint').classList.add('hidden'), 3500);
      }
    };

    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      handleDown(e.clientX - rect.left, e.clientY - rect.top);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      handleMove(e.clientX - rect.left, e.clientY - rect.top);
    });

    window.addEventListener('mouseup', handleUp);

    // Touch support
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        const rect = this.canvas.getBoundingClientRect();
        handleDown(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
      }
    });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const rect = this.canvas.getBoundingClientRect();
        handleMove(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
      }
    });

    window.addEventListener('touchend', handleUp);
  }

  loadLevel(levelNum) {
    this.currentLevel = levelNum;
    document.getElementById('level-num').textContent = levelNum;
    this.score = 0;
    this.updateScoreUI();

    // Prepare Cats Queue
    const catConfigs = [CAT_TYPES.RED, CAT_TYPES.YELLOW, CAT_TYPES.BLACK, CAT_TYPES.FAT];
    this.cats = catConfigs.map(c => new Cat(this.slingPos.x, this.slingPos.y, c));
    this.activeCatIndex = 0;
    this.currentCat = this.cats[0];

    // Load Stage Obstacles and Dogs
    this.blocks = [];
    this.dogs = [];

    if (levelNum === 1) {
      // Outpost layout
      this.blocks.push(new Block(800, 530, 30, 100, 'wood'));
      this.blocks.push(new Block(920, 530, 30, 100, 'wood'));
      this.blocks.push(new Block(860, 470, 160, 20, 'glass'));

      this.blocks.push(new Block(820, 410, 25, 80, 'wood'));
      this.blocks.push(new Block(900, 410, 25, 80, 'wood'));
      this.blocks.push(new Block(860, 360, 120, 20, 'wood'));

      this.dogs.push(new Dog(860, 550, 20, 100));
      this.dogs.push(new Dog(860, 440, 18, 90));
    } else if (levelNum === 2) {
      // Fortress with TNT
      this.blocks.push(new Block(750, 530, 30, 100, 'stone'));
      this.blocks.push(new Block(870, 530, 30, 100, 'tnt'));
      this.blocks.push(new Block(990, 530, 30, 100, 'stone'));
      this.blocks.push(new Block(870, 470, 270, 20, 'stone'));

      this.blocks.push(new Block(800, 410, 25, 80, 'glass'));
      this.blocks.push(new Block(940, 410, 25, 80, 'glass'));
      this.blocks.push(new Block(870, 360, 170, 20, 'glass'));

      this.dogs.push(new Dog(810, 550, 22, 120));
      this.dogs.push(new Dog(930, 550, 22, 120));
      this.dogs.push(new Dog(870, 320, 24, 150, true)); // Boss
    } else if (levelNum === 3) {
      // Bark Castle
      for (let i = 0; i < 4; i++) {
        const x = 750 + i * 70;
        this.blocks.push(new Block(x, 530, 25, 100, i % 2 === 0 ? 'stone' : 'wood'));
      }
      this.blocks.push(new Block(855, 470, 240, 20, 'stone'));

      this.blocks.push(new Block(800, 410, 25, 80, 'tnt'));
      this.blocks.push(new Block(910, 410, 25, 80, 'tnt'));
      this.blocks.push(new Block(855, 360, 150, 20, 'wood'));

      this.dogs.push(new Dog(780, 550, 20, 100));
      this.dogs.push(new Dog(855, 550, 26, 180, true));
      this.dogs.push(new Dog(930, 550, 20, 100));
      this.dogs.push(new Dog(855, 320, 22, 120));
    }
  }

  triggerExplosion(x, y, radius, damage) {
    // Damage blocks and dogs in area
    this.blocks.forEach(b => {
      const dist = Math.hypot(b.x - x, b.y - y);
      if (dist < radius) {
        b.takeDamage(damage);
        this.addScore(150);
      }
    });

    this.dogs.forEach(d => {
      const dist = Math.hypot(d.x - x, d.y - y);
      if (dist < radius) {
        d.takeDamage(damage);
        this.addScore(400);
      }
    });

    // Create explosion particles
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 8 + 2;
      this.particles.push(new Particle(x, y, '#fb8500', Math.random() * 6 + 3, Math.cos(angle) * spd, Math.sin(angle) * spd, 35));
    }
  }

  handleCollisions() {
    if (!this.currentCat || !this.currentCat.launched || this.currentCat.stopped) return;

    // Cat vs Blocks
    this.blocks.forEach(b => {
      if (!b.alive) return;
      if (this.currentCat.x + this.currentCat.radius > b.x - b.width / 2 &&
          this.currentCat.x - this.currentCat.radius < b.x + b.width / 2 &&
          this.currentCat.y + this.currentCat.radius > b.y - b.height / 2 &&
          this.currentCat.y - this.currentCat.radius < b.y + b.height / 2) {
        
        const speed = Math.hypot(this.currentCat.vx, this.currentCat.vy);
        const damage = speed * 12 * this.currentCat.mass;
        b.takeDamage(damage);
        this.addScore(Math.floor(damage * 2));

        if (b.type === 'tnt' && !b.alive) {
          this.triggerExplosion(b.x, b.y, 140, 200);
        }

        // Kinetic collision response
        this.currentCat.vx *= -0.4;
        this.currentCat.vy *= -0.4;
        b.vx += this.currentCat.vx * 0.5;
        b.vy += this.currentCat.vy * 0.5;
      }
    });

    // Cat vs Dogs
    this.dogs.forEach(d => {
      if (!d.alive) return;
      const dist = Math.hypot(this.currentCat.x - d.x, this.currentCat.y - d.y);
      if (dist < this.currentCat.radius + d.radius) {
        const speed = Math.hypot(this.currentCat.vx, this.currentCat.vy);
        const damage = speed * 25 * this.currentCat.mass;
        d.takeDamage(damage);
        this.addScore(500);

        this.currentCat.vx *= -0.5;
        d.vx += this.currentCat.vx * 0.8;
      }
    });
  }

  addScore(pts) {
    this.score += pts;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('angry_cats_highscore', this.highScore.toString());
    }
    this.updateScoreUI();
  }

  updateScoreUI() {
    document.getElementById('score-val').textContent = this.score;
    document.getElementById('high-score-val').textContent = this.highScore;
  }

  checkStageEnd() {
    const allDogsDead = this.dogs.every(d => !d.alive);
    const catFinished = this.currentCat && (this.currentCat.stopped || this.currentCat.x > 1250 || this.currentCat.x < -50);

    if (allDogsDead) {
      setTimeout(() => this.showEndModal(true), 800);
    } else if (catFinished) {
      // Advance to next cat
      if (this.activeCatIndex < this.cats.length - 1) {
        this.activeCatIndex++;
        this.currentCat = this.cats[this.activeCatIndex];
        this.currentCat.x = this.slingPos.x;
        this.currentCat.y = this.slingPos.y;
      } else {
        setTimeout(() => this.showEndModal(false), 1200);
      }
    }
  }

  showEndModal(won) {
    const modal = document.getElementById('modal-end');
    const title = document.getElementById('end-title');
    const scoreText = document.getElementById('end-score-text');
    const nextBtn = document.getElementById('btn-next-level');

    modal.classList.remove('hidden');
    if (won) {
      title.textContent = 'STAGE CLEARED! 🎉';
      scoreText.textContent = `Final Score: ${this.score}`;
      nextBtn.style.display = 'inline-block';
    } else {
      title.textContent = 'STAGE FAILED 😿';
      scoreText.textContent = `Dogs survived! Retry to crush them!`;
      nextBtn.style.display = 'none';
    }
  }

  drawTrajectory() {
    if (!this.isDragging || !this.currentCat) return;

    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([6, 6]);
    this.ctx.beginPath();

    const dx = this.slingPos.x - this.dragPos.x;
    const dy = this.slingPos.y - this.dragPos.y;
    let simX = this.slingPos.x;
    let simY = this.slingPos.y;
    let simVx = dx * 0.18;
    let simVy = dy * 0.18;

    this.ctx.moveTo(simX, simY);
    for (let i = 0; i < 28; i++) {
      simVx *= 0.992;
      simVy += this.gravity;
      simX += simVx;
      simY += simVy;
      this.ctx.lineTo(simX, simY);
    }
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawSlingshot() {
    // Back band
    this.ctx.strokeStyle = '#3d261d';
    this.ctx.lineWidth = 6;
    if (this.isDragging) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.slingPos.x - 15, this.slingPos.y - 20);
      this.ctx.lineTo(this.dragPos.x, this.dragPos.y);
      this.ctx.stroke();
    }

    // Wooden Fork base
    this.ctx.fillStyle = '#8d5b4c';
    this.ctx.fillRect(this.slingPos.x - 10, this.slingPos.y, 20, 110);

    // Front band
    if (this.isDragging) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.slingPos.x + 15, this.slingPos.y - 20);
      this.ctx.lineTo(this.dragPos.x, this.dragPos.y);
      this.ctx.stroke();
    }
  }

  gameLoop() {
    // Background / Sky gradient
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, 650);
    skyGrad.addColorStop(0, '#87ceeb');
    skyGrad.addColorStop(0.7, '#e0f6ff');
    skyGrad.addColorStop(1, '#94d2bd');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, 1200, 650);

    // Ground
    this.ctx.fillStyle = '#2a9d8f';
    this.ctx.fillRect(0, 580, 1200, 70);
    this.ctx.fillStyle = '#e9c46a';
    this.ctx.fillRect(0, 580, 1200, 8);

    // Draw Slingshot
    this.drawSlingshot();

    // Draw Trajectory preview
    this.drawTrajectory();

    // Update & Draw Entities
    this.blocks.forEach(b => {
      b.update(this.gravity);
      b.draw(this.ctx);
    });

    this.dogs.forEach(d => {
      d.update(this.gravity);
      d.draw(this.ctx);
    });

    // Draw Waiting Cats Queue
    this.cats.forEach((cat, index) => {
      if (index > this.activeCatIndex) {
        cat.x = this.slingPos.x - (index - this.activeCatIndex) * 35;
        cat.y = 560;
        cat.draw(this.ctx);
      }
    });

    // Current Cat update & draw
    if (this.currentCat) {
      this.currentCat.update(this.gravity);
      this.currentCat.draw(this.ctx);
    }

    // Particles update & draw
    this.particles.forEach((p, idx) => {
      p.update();
      p.draw(this.ctx);
      if (p.life <= 0) this.particles.splice(idx, 1);
    });

    this.handleCollisions();
    this.checkStageEnd();

    requestAnimationFrame(this.gameLoop);
  }
}

// Script load hook
window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameApp();
});
