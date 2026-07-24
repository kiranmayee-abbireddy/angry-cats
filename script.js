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
    this.stageEndTriggered = false; // prevents checkStageEnd firing modal multiple times per level
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
    this.stageEndTriggered = false; // reset guard for new level

    const catConfigs = [CAT_TYPES.RED, CAT_TYPES.YELLOW, CAT_TYPES.BLACK, CAT_TYPES.FAT];
    this.cats = catConfigs.map(c => new Cat(this.slingPos.x, this.slingPos.y, c));
    this.activeCatIndex = 0;
    this.currentCat = this.cats[0];

    this.blocks = [];
    this.dogs = [];
    this.particles = [];
    this.debris = [];
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

    // ── Pre-settle: run physics silently so the building is perfectly stable ──
    // Temporarily wake all blocks so the constraint solver can settle them.
    this.blocks.forEach(b => { b.sleeping = false; });
    for (let s = 0; s < 120; s++) this.updateBlockPhysics();
    // Force everything to sleep at rested positions.
    this.blocks.forEach(b => { b.sleeping = true; b.vx = 0; b.vy = 0; b.vAngle = 0; });
  }

  addFloatingText(text, x, y, color = '#ffb703') {
    this.floatingTexts.push(new FloatingText(text, x, y, color));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BLOCK PHYSICS ENGINE  (Angry Birds-style sleeping + AABB constraint solver)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Main physics tick for all blocks.
   * 1. Integrate gravity + velocity for awake blocks.
   * 2. Resolve ground + block-block constraints (4 iterations).
   * 3. Detect sleeping (blocks that have settled).
   */
  updateBlockPhysics() {
    const alive = this.blocks.filter(b => b.alive);

    // 1. Integrate awake blocks
    for (const b of alive) {
      if (b.sleeping) continue;
      b.vy     += this.gravity;
      b.vx     *= 0.986;      // air resistance
      b.vAngle *= 0.91;       // angular damping
      b.x      += b.vx;
      b.y      += b.vy;
      b.angle  += b.vAngle;
    }

    // 2. Multi-pass constraint resolution
    for (let iter = 0; iter < 4; iter++) {
      // Ground constraint
      for (const b of alive) {
        if (b.sleeping) continue;
        if (b.y + b.height / 2 > 570) {
          b.y = 570 - b.height / 2;
          if (b.vy > 0.4) {
            b.vy     = -b.vy * 0.13;
            b.vAngle *= 0.45;
          } else {
            b.vy = 0;
          }
          b.vx *= 0.68;
        }
      }
      // Block-block AABB pairs
      for (let i = 0; i < alive.length - 1; i++) {
        for (let j = i + 1; j < alive.length; j++) {
          if (alive[i].sleeping && alive[j].sleeping) continue;
          this.resolveBlockPair(alive[i], alive[j]);
        }
      }
    }

    // 3. Sleep detection
    for (const b of alive) {
      if (b.sleeping) continue;
      const speed = Math.hypot(b.vx, b.vy);
      if (speed < 0.08 && Math.abs(b.vAngle) < 0.005) {
        b.sleepTimer++;
        if (b.sleepTimer > 45) {
          b.sleeping  = true;
          b.vx = 0; b.vy = 0; b.vAngle = 0;
        }
      } else {
        b.sleepTimer = 0;
      }
    }
  }

  /**
   * AABB collision response between two blocks.
   * Resolves along the axis of minimum penetration.
   * Mass-weighted position correction + impulse-based velocity response.
   */
  resolveBlockPair(a, b) {
    const ax1 = a.x - a.width  / 2, ax2 = a.x + a.width  / 2;
    const ay1 = a.y - a.height / 2, ay2 = a.y + a.height / 2;
    const bx1 = b.x - b.width  / 2, bx2 = b.x + b.width  / 2;
    const by1 = b.y - b.height / 2, by2 = b.y + b.height / 2;

    if (ax2 <= bx1 || bx2 <= ax1 || ay2 <= by1 || by2 <= ay1) return; // no overlap

    const overlapX   = Math.min(ax2 - bx1, bx2 - ax1);
    const overlapY   = Math.min(ay2 - by1, by2 - ay1);
    const totalMass  = a.mass + b.mass;
    const restitution = 0.11;

    if (overlapY <= overlapX) {
      // ── Vertical collision (stacking) ──
      const aAbove = a.y < b.y;
      const top = aAbove ? a : b;
      const bot = aAbove ? b : a;
      const push = overlapY / totalMass;

      top.y -= push * bot.mass;
      bot.y += push * top.mass;

      const relVy = top.vy - bot.vy;
      if (relVy > 0) {
        const j    = -(1 + restitution) * relVy / totalMass;
        top.vy    += j * bot.mass / totalMass;
        bot.vy    -= j * top.mass / totalMass;
      }
      // Surface friction: dampen relative sliding
      const relVx = top.vx - bot.vx;
      top.vx -= relVx * 0.13 * (bot.mass / totalMass);
      bot.vx += relVx * 0.13 * (top.mass / totalMass);

    } else {
      // ── Horizontal collision (side push / topple) ──
      const aLeft = a.x < b.x;
      const left  = aLeft ? a : b;
      const right = aLeft ? b : a;
      const push  = overlapX / totalMass;

      left.x  -= push * right.mass;
      right.x += push * left.mass;

      const relVx = left.vx - right.vx;
      if (relVx > 0) {
        const j   = -(1 + restitution) * relVx;
        left.vx  += j * right.mass / totalMass;
        right.vx -= j * left.mass  / totalMass;
      }
      // Topple effect: side collision imparts slight spin
      left.vAngle  += (Math.random() - 0.5) * 0.028;
      right.vAngle += (Math.random() - 0.5) * 0.028;
    }

    // Wake both blocks (contact = disturbance)
    a.wakeUp(); b.wakeUp();
  }

  /**
   * Wake all alive blocks within a given radius.
   * Called when a block is destroyed or explodes so neighbours cascade.
   */
  wakeBlocksNear(x, y, radius) {
    for (const b of this.blocks) {
      if (!b.alive) continue;
      const dist = Math.hypot(b.x - x, b.y - y);
      if (dist < radius + (b.width + b.height) * 0.5) {
        b.wakeUp();
      }
    }
  }

  /**
   * Give an immediate downward impulse to every block resting directly
   * on top of a newly-destroyed block.  Without this, the constraint
   * solver would catch them on the same frame and prevent visible fall.
   */
  collapseAbove(deadBlock) {
    const deadTop  = deadBlock.y - deadBlock.height / 2;
    const deadLeft = deadBlock.x - deadBlock.width  / 2;
    const deadRight= deadBlock.x + deadBlock.width  / 2;

    for (const b of this.blocks) {
      if (!b.alive) continue;
      const bBot   = b.y + b.height / 2;
      const bLeft  = b.x - b.width  / 2;
      const bRight = b.x + b.width  / 2;

      // X ranges must overlap and block's bottom must be sitting on deadTop
      const xOverlap = bRight > deadLeft + 2 && bLeft < deadRight - 2;
      const onTop    = Math.abs(bBot - deadTop) < 8;

      if (xOverlap && onTop) {
        b.wakeUp();
        b.vy   += 1.8;                         // kick downward — enough to clear constraint
        b.vAngle += (Math.random() - 0.5) * 0.06; // slight topple spin
        // Recursively collapse anything above this block too
        this.collapseAbove(b);
      }
    }
  }

  /**
   * Spawn Angry Birds-style tumbling debris chunks from a destroyed block.
   * Count and spread scale with block size.
   */
  spawnBlockDebris(block) {
    const area = block.width * block.height;
    const count = Math.min(10, Math.max(4, Math.floor(area / 250)));

    for (let i = 0; i < count; i++) {
      // Chunk size: random fraction of the block
      const w = block.width  * (0.18 + Math.random() * 0.30);
      const h = block.height * (0.18 + Math.random() * 0.30);

      // Spawn position: random point inside the block
      const spawnX = block.x + (Math.random() - 0.5) * block.width  * 0.8;
      const spawnY = block.y + (Math.random() - 0.5) * block.height * 0.8;

      // Velocity: burst outward + inherit block momentum
      const angle  = Math.random() * Math.PI * 2;
      const speed  = 3.5 + Math.random() * 6;
      const vx = Math.cos(angle) * speed + block.vx * 0.6;
      const vy = Math.sin(angle) * speed + block.vy * 0.4 - 1.5; // bias upward
      const vAngle = (Math.random() - 0.5) * 0.35;

      this.debris.push(new Debris(spawnX, spawnY, w, h, block.type, vx, vy, vAngle));
    }

    // Dust puff particles (small, fast-fading)
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 2 + Math.random() * 4;
      const dustColor = block.type === 'glass' ? 'rgba(200,235,245,0.7)'
                      : block.type === 'stone'  ? 'rgba(160,160,160,0.7)'
                      : 'rgba(180,130,80,0.7)';
      this.particles.push(new Particle(block.x, block.y, dustColor,
        4 + Math.random() * 5, Math.cos(a) * s, Math.sin(a) * s - 1, 25 + Math.random() * 15));
    }
  }

  triggerExplosion(x, y, radius, damage) {
    this.shakeTime = 15;
    this.shakeMagnitude = 8;

    // Wake everything in blast radius first
    this.wakeBlocksNear(x, y, radius);

    this.blocks.forEach(b => {
      const dist = Math.hypot(b.x - x, b.y - y);
      if (dist < radius) {
        const wasAlive = b.alive;
        b.takeDamage(damage);
        b.vAngle = (Math.random() - 0.5) * 0.5;
        // Blast impulse
        const ang = Math.atan2(b.y - y, b.x - x);
        const force = (1 - dist / radius) * 12;
        b.vx += Math.cos(ang) * force;
        b.vy += Math.sin(ang) * force - 3;
        this.addScore(200);
        this.addFloatingText('+200', b.x, b.y);
        if (wasAlive && !b.alive) {
          this.spawnBlockDebris(b);
          this.wakeBlocksNear(b.x, b.y, Math.max(b.width, b.height) * 2.5);
          this.collapseAbove(b);
        }
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

        const speed  = Math.hypot(this.currentCat.vx, this.currentCat.vy);
        const damage = speed * 16 * this.currentCat.mass;
        const wasAlive = b.alive;
        b.takeDamage(damage);
        b.vAngle = (Math.random() - 0.5) * 0.4;

        // Impulse transfer — cat pushes block
        b.vx += this.currentCat.vx * (0.8 / b.mass);
        b.vy += this.currentCat.vy * (0.8 / b.mass);

        // Wake the hit block + nearby blocks (cascade collapse)
        // Radius = 1.5x max dimension — enough to cascade to adjacent blocks only
        this.wakeBlocksNear(b.x, b.y, Math.max(b.width, b.height) * 1.5);

        const scoreGain = Math.floor(damage * 3);
        this.addScore(scoreGain);
        this.addFloatingText(`+${scoreGain}`, b.x, b.y);

        // Debris + upward cascade collapse if block just died
        if (wasAlive && !b.alive) {
          this.spawnBlockDebris(b);
          this.wakeBlocksNear(b.x, b.y, Math.max(b.width, b.height) * 5);
          this.collapseAbove(b); // push anything resting on this block into free-fall
        }

        if (b.type === 'tnt' && !b.alive) {
          this.triggerExplosion(b.x, b.y, 150, 220);
        }

        // Cat slows on impact (mass-based)
        this.currentCat.vx *= 0.5;
        this.currentCat.vy *= 0.5;
      }
    });

    // Cat vs Dogs
    this.dogs.forEach(d => {
      if (!d.alive) return;
      const dist = Math.hypot(this.currentCat.x - d.x, this.currentCat.y - d.y);
      if (dist < this.currentCat.radius + d.radius) {
        const speed  = Math.hypot(this.currentCat.vx, this.currentCat.vy);
        const damage = speed * 30 * this.currentCat.mass;
        d.takeDamage(damage);

        this.addScore(600);
        this.addFloatingText('+600 🐾', d.x, d.y, '#ffb703');

        d.vx += this.currentCat.vx * 1.2;
        d.vy += this.currentCat.vy * 1.2 - 2;
        this.currentCat.vx *= 0.4;
      }
    });

    // Moving blocks physically smashing into dogs
    this.blocks.forEach(b => {
      if (!b.alive || b.sleeping) return;
      const speed = Math.hypot(b.vx, b.vy);
      if (speed < 3.0) return; // must be fast-moving to hurt a dog
      this.dogs.forEach(d => {
        if (!d.alive) return;
        // Proper AABB vs circle: find nearest point on block rect to dog center.
        // This way a block the dog is standing ON (touching but not penetrating)
        // will never accidentally deal damage.
        const bLeft   = b.x - b.width  / 2;
        const bRight  = b.x + b.width  / 2;
        const bTop    = b.y - b.height / 2;
        const bBottom = b.y + b.height / 2;
        const nearX = Math.max(bLeft, Math.min(d.x, bRight));
        const nearY = Math.max(bTop,  Math.min(d.y, bBottom));
        const dist  = Math.hypot(nearX - d.x, nearY - d.y);
        // Only damage if block is actually penetrating the dog's circle
        if (dist < d.radius * 0.85) {
          d.takeDamage(speed * 18);
          d.vx += b.vx * 0.85;
          d.vy += b.vy * 0.85 - 1;
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
    if (this.stageEndTriggered) return; // already handled this level
    if (this.dogs.length === 0) return; // guard: level not yet loaded or no dogs

    const allDogsDead = this.dogs.length > 0 && this.dogs.every(d => !d.alive);
    const catFinished = this.currentCat && (this.currentCat.stopped || this.currentCat.x > 1250 || this.currentCat.x < -50);

    if (allDogsDead) {
      this.stageEndTriggered = true;
      setTimeout(() => this.showEndModal(true), 800);
    } else if (catFinished) {
      if (this.activeCatIndex < this.cats.length - 1) {
        this.activeCatIndex++;
        this.currentCat = this.cats[this.activeCatIndex];
        this.currentCat.x = this.slingPos.x;
        this.currentCat.y = this.slingPos.y;
      } else {
        this.stageEndTriggered = true;
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
    const img = assets.getImage('slingshot');

    // SVG is 120x200 viewBox, drawn at canvas size 100x166 starting at (slingPos.x-50, 404)
    // Left strap joint in SVG: cx=26, cy=17 → canvas: x = (slingPos.x-50) + (26/120)*100, y = 404 + (17/200)*166
    // Right strap joint in SVG: cx=94, cy=17 → canvas: x = (slingPos.x-50) + (94/120)*100, y = 404 + (17/200)*166
    const drawX = this.slingPos.x - 50;
    const drawY = 404;
    const scaleX = 100 / 120;
    const scaleY = 166 / 200;

    const leftProngX  = drawX + 26 * scaleX;  // ≈ slingPos.x - 28.3
    const leftProngY  = drawY + 17 * scaleY;  // ≈ 418
    const rightProngX = drawX + 94 * scaleX;  // ≈ slingPos.x + 28.3
    const rightProngY = drawY + 17 * scaleY;  // ≈ 418

    // 1. Back Rubber Band (drawn behind the slingshot frame)
    this.ctx.strokeStyle = '#2b1704';
    this.ctx.lineWidth = 7;
    this.ctx.lineCap = 'round';
    this.ctx.setLineDash([]);
    if (this.isDragging) {
      this.ctx.beginPath();
      this.ctx.moveTo(leftProngX, leftProngY);
      this.ctx.lineTo(this.dragPos.x, this.dragPos.y);
      this.ctx.stroke();
    } else {
      // Idle: draw short rest band between both prongs
      this.ctx.beginPath();
      this.ctx.moveTo(leftProngX, leftProngY);
      this.ctx.lineTo(rightProngX, rightProngY);
      this.ctx.stroke();
    }

    // 2. Slingshot Wooden Y-Frame Image Asset
    if (img && img.complete && img.naturalWidth !== 0) {
      this.ctx.drawImage(img, drawX, drawY, 100, 166);
    } else {
      this.ctx.fillStyle = '#6e4723';
      this.ctx.fillRect(this.slingPos.x - 12, 450, 24, 120);
    }

    // 3. Front Rubber Band & Leather Pouch (drawn over the front of the frame)
    this.ctx.strokeStyle = '#5a320d';
    this.ctx.lineWidth = 6;
    this.ctx.lineCap = 'round';
    if (this.isDragging) {
      this.ctx.beginPath();
      this.ctx.moveTo(rightProngX, rightProngY);
      this.ctx.lineTo(this.dragPos.x, this.dragPos.y);
      this.ctx.stroke();

      // Leather Sling Pouch holding the cat
      this.ctx.save();
      this.ctx.translate(this.dragPos.x, this.dragPos.y);
      this.ctx.fillStyle = '#3a1e0b';
      this.ctx.strokeStyle = '#1a0b03';
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, 18, 11, Math.atan2(this.slingPos.y - this.dragPos.y, this.slingPos.x - this.dragPos.x), 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();
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

    // Entities — blocks: physics handled by updateBlockPhysics()
    this.updateBlockPhysics();
    this.blocks.forEach(b => b.draw(this.ctx));

    this.dogs.forEach(d => {
      d.update(this.gravity, this.blocks, this.dogs);
      d.draw(this.ctx);
    });

    // Waiting Cats Queue (Seated neatly on ground level y=570 - radius)
    this.cats.forEach((cat, index) => {
      if (index > this.activeCatIndex) {
        cat.x = this.slingPos.x - 90 - (index - this.activeCatIndex - 1) * 45;
        cat.y = 570 - cat.radius;
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

    // Debris chunks (drawn above particles for depth)
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.update(this.gravity);
      d.draw(this.ctx);
      if (d.life <= 0) this.debris.splice(i, 1);
    }

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

