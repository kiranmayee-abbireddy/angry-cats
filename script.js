/**
 * Main Game Controller and Physics System
 */

class GameApp {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.gravity = 0.35;

    // Slingshot anchor
    this.slingPos = { x: 180, y: 460 };

    // Game entities & state
    this.cats = [];
    this.activeCatIndex = 0;
    this.currentCat = null;
    this.dogs = [];
    this.blocks = [];
    this.particles = [];
    this.floatingTexts = [];

    // Screen Shake effect
    this.shakeTime = 0;
    this.shakeMagnitude = 0;

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

    // Slingshot & Ability Interactions
    const handleDown = (x, y) => {
      if (this.currentCat && !this.currentCat.launched) {
        const dist = Math.hypot(x - this.slingPos.x, y - this.slingPos.y);
        if (dist < 70) {
          this.isDragging = true;
        }
      } else if (this.currentCat && this.currentCat.launched && !this.currentCat.usedAbility) {
        const abilityResult = this.currentCat.useAbility();
        if (abilityResult === 'EXPLODE') {
          this.triggerExplosion(this.currentCat.x, this.currentCat.y, 140, 220);
          this.currentCat.stopped = true;
        } else if (abilityResult === 'BOOST') {
          this.addFloatingText('TURBO SPEED! ⚡', this.currentCat.x, this.currentCat.y - 20, '#ffb703');
        }
      }
    };

    const handleMove = (x, y) => {
      if (!this.isDragging) return;
      const maxPull = 120;
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
        this.currentCat.vx = dx * 0.19;
        this.currentCat.vy = dy * 0.19;
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

    // Touch Support
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

    const catConfigs = [CAT_TYPES.RED, CAT_TYPES.YELLOW, CAT_TYPES.BLACK, CAT_TYPES.FAT];
    this.cats = catConfigs.map(c => new Cat(this.slingPos.x, this.slingPos.y, c));
    this.activeCatIndex = 0;
    this.currentCat = this.cats[0];

    this.blocks = [];
    this.dogs = [];
    this.particles = [];
    this.floatingTexts = [];

    if (levelNum === 1) {
      // Outpost
      // Ground Pillars (Bottom floor)
      this.blocks.push(new Block(800, 520, 30, 100, 'wood'));
      this.blocks.push(new Block(930, 520, 30, 100, 'wood'));

      // Floor 1 Plank (Lower Roof resting directly on ground pillars)
      this.blocks.push(new Block(865, 460, 170, 20, 'glass'));

      // Upper Pillars (Floor 2, resting on Floor 1 Plank)
      this.blocks.push(new Block(820, 410, 25, 80, 'wood'));
      this.blocks.push(new Block(910, 410, 25, 80, 'wood'));

      // Floor 2 Roof Plank (Top Roof resting on Floor 2 Pillars)
      this.blocks.push(new Block(865, 360, 130, 20, 'wood'));

      // Dogs standing on floor levels
      this.dogs.push(new Dog(865, 438, 20, 100)); // Lower Dog standing on Floor 1 Glass Plank
      this.dogs.push(new Dog(865, 338, 20, 90));  // Upper Dog standing on Top Wood Roof Plank
    } else if (levelNum === 2) {
      // Bone Fortress with TNT
      this.blocks.push(new Block(750, 520, 30, 100, 'stone'));
      this.blocks.push(new Block(870, 520, 35, 100, 'tnt'));
      this.blocks.push(new Block(990, 520, 30, 100, 'stone'));
      this.blocks.push(new Block(870, 460, 270, 20, 'stone'));

      this.blocks.push(new Block(800, 400, 25, 80, 'glass'));
      this.blocks.push(new Block(940, 400, 25, 80, 'glass'));
      this.blocks.push(new Block(870, 350, 170, 20, 'glass'));

      this.dogs.push(new Dog(810, 440, 22, 120)); // On lower roof
      this.dogs.push(new Dog(930, 440, 22, 120)); // On lower roof
      this.dogs.push(new Dog(870, 320, 26, 160, true)); // Boss on top roof
    } else if (levelNum === 3) {
      // Bark Castle
      for (let i = 0; i < 4; i++) {
        const x = 750 + i * 70;
        this.blocks.push(new Block(x, 520, 25, 100, i % 2 === 0 ? 'stone' : 'wood'));
      }
      this.blocks.push(new Block(855, 460, 240, 20, 'stone'));

      this.blocks.push(new Block(800, 400, 25, 80, 'tnt'));
      this.blocks.push(new Block(910, 400, 25, 80, 'tnt'));
      this.blocks.push(new Block(855, 350, 150, 20, 'wood'));

      this.dogs.push(new Dog(785, 440, 22, 100)); // On lower roof
      this.dogs.push(new Dog(855, 440, 28, 200, true)); // Boss lower roof
      this.dogs.push(new Dog(925, 440, 22, 100)); // On lower roof
      this.dogs.push(new Dog(855, 320, 22, 120)); // On top roof
    }
  }

  addFloatingText(text, x, y, color = '#ffb703') {
    this.floatingTexts.push(new FloatingText(text, x, y, color));
  }

  triggerExplosion(x, y, radius, damage) {
    this.shakeTime = 15;
    this.shakeMagnitude = 8;

    this.blocks.forEach(b => {
      const dist = Math.hypot(b.x - x, b.y - y);
      if (dist < radius) {
        b.takeDamage(damage);
        b.vAngle = (Math.random() - 0.5) * 0.4;
        this.addScore(200);
        this.addFloatingText('+200', b.x, b.y);
      }
    });

    this.dogs.forEach(d => {
      const dist = Math.hypot(d.x - x, d.y - y);
      if (dist < radius) {
        d.takeDamage(damage);
        d.vx += (d.x - x) * 0.15;
        d.vy -= 4;
        this.addScore(500);
        this.addFloatingText('+500 💥', d.x, d.y, '#e63946');
      }
    });

    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 9 + 3;
      this.particles.push(new Particle(x, y, '#fb8500', Math.random() * 8 + 3, Math.cos(angle) * spd, Math.sin(angle) * spd, 40));
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
        const damage = speed * 16 * this.currentCat.mass;
        b.takeDamage(damage);
        b.vAngle = (Math.random() - 0.5) * 0.4;

        // Realistic Physics Impulse Transfer
        b.vx += this.currentCat.vx * 0.7;
        b.vy += this.currentCat.vy * 0.7;
        
        const scoreGain = Math.floor(damage * 3);
        this.addScore(scoreGain);
        this.addFloatingText(`+${scoreGain}`, b.x, b.y);

        if (b.type === 'tnt' && !b.alive) {
          this.triggerExplosion(b.x, b.y, 150, 220);
        }

        // Cat velocity bounce reduction based on block HP / mass
        this.currentCat.vx *= 0.5;
        this.currentCat.vy *= 0.5;
      }
    });

    // Cat vs Dogs
    this.dogs.forEach(d => {
      if (!d.alive) return;
      const dist = Math.hypot(this.currentCat.x - d.x, this.currentCat.y - d.y);
      if (dist < this.currentCat.radius + d.radius) {
        const speed = Math.hypot(this.currentCat.vx, this.currentCat.vy);
        const damage = speed * 30 * this.currentCat.mass;
        d.takeDamage(damage);

        this.addScore(600);
        this.addFloatingText('+600 🐾', d.x, d.y, '#ffb703');

        // Knockback physics
        d.vx += this.currentCat.vx * 1.2;
        d.vy += this.currentCat.vy * 1.2 - 2;
        this.currentCat.vx *= 0.4;
      }
    });

    // Blocks vs Dogs secondary collision physics
    this.blocks.forEach(b => {
      if (!b.alive || (Math.abs(b.vx) < 1 && Math.abs(b.vy) < 1)) return;
      this.dogs.forEach(d => {
        if (!d.alive) return;
        const dist = Math.hypot(b.x - d.x, b.y - d.y);
        if (dist < d.radius + b.width / 2) {
          const speed = Math.hypot(b.vx, b.vy);
          d.takeDamage(speed * 18);
          d.vx += b.vx * 0.8;
          d.vy += b.vy * 0.8;
          this.addScore(300);
          this.addFloatingText('+300 💥', d.x, d.y, '#fb8500');
        }
      });
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
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    this.ctx.lineWidth = 3.5;
    this.ctx.setLineDash([8, 8]);
    this.ctx.beginPath();

    const dx = this.slingPos.x - this.dragPos.x;
    const dy = this.slingPos.y - this.dragPos.y;
    let simX = this.slingPos.x;
    let simY = this.slingPos.y;
    let simVx = dx * 0.19;
    let simVy = dy * 0.19;

    this.ctx.moveTo(simX, simY);
    for (let i = 0; i < 30; i++) {
      simVx *= 0.993;
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
    this.ctx.lineWidth = 7;
    if (this.isDragging) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.slingPos.x - 15, this.slingPos.y - 20);
      this.ctx.lineTo(this.dragPos.x, this.dragPos.y);
      this.ctx.stroke();
    }

    // Wooden Fork base
    this.ctx.fillStyle = '#6e4723';
    this.ctx.fillRect(this.slingPos.x - 12, this.slingPos.y, 24, 120);

    // Front band
    if (this.isDragging) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.slingPos.x + 15, this.slingPos.y - 20);
      this.ctx.lineTo(this.dragPos.x, this.dragPos.y);
      this.ctx.stroke();
    }
  }

  gameLoop() {
    this.ctx.save();

    // Handle Camera Screen Shake
    if (this.shakeTime > 0) {
      const offsetX = (Math.random() - 0.5) * this.shakeMagnitude;
      const offsetY = (Math.random() - 0.5) * this.shakeMagnitude;
      this.ctx.translate(offsetX, offsetY);
      this.shakeTime--;
    }

    // Background Graphic / Scenery
    const bgImg = assets.getImage('bg');
    if (bgImg && bgImg.complete && bgImg.naturalWidth !== 0) {
      this.ctx.drawImage(bgImg, 0, 0, 1200, 650);
    } else {
      const skyGrad = this.ctx.createLinearGradient(0, 0, 0, 650);
      skyGrad.addColorStop(0, '#87ceeb');
      skyGrad.addColorStop(0.7, '#e0f6ff');
      skyGrad.addColorStop(1, '#94d2bd');
      this.ctx.fillStyle = skyGrad;
      this.ctx.fillRect(0, 0, 1200, 650);
    }

    // Ground Grass
    this.ctx.fillStyle = '#2a9d8f';
    this.ctx.fillRect(0, 570, 1200, 80);
    this.ctx.fillStyle = '#e9c46a';
    this.ctx.fillRect(0, 570, 1200, 10);

    // Draw Slingshot
    this.drawSlingshot();

    // Draw Trajectory
    this.drawTrajectory();

    // Entities
    this.blocks.forEach(b => {
      b.update(this.gravity, this.blocks);
      b.draw(this.ctx);
    });

    this.dogs.forEach(d => {
      d.update(this.gravity, this.blocks, this.dogs);
      d.draw(this.ctx);
    });

    // Waiting Cats Queue
    this.cats.forEach((cat, index) => {
      if (index > this.activeCatIndex) {
        cat.x = this.slingPos.x - (index - this.activeCatIndex) * 45;
        cat.y = 550;
        cat.draw(this.ctx);
      }
    });

    // Active Cat
    if (this.currentCat) {
      this.currentCat.update(this.gravity);
      this.currentCat.draw(this.ctx);
    }

    // Particles
    this.particles.forEach((p, idx) => {
      p.update();
      p.draw(this.ctx);
      if (p.life <= 0) this.particles.splice(idx, 1);
    });

    // Floating Score Texts
    this.floatingTexts.forEach((ft, idx) => {
      ft.update();
      ft.draw(this.ctx);
      if (ft.alpha <= 0) this.floatingTexts.splice(idx, 1);
    });

    this.handleCollisions();
    this.checkStageEnd();

    this.ctx.restore();
    requestAnimationFrame(this.gameLoop);
  }
}

// Script load hook
window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameApp();
});

