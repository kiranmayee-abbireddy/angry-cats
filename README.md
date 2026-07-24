# 🐾 Angry Cats - 2D Physics Arcade Web Game

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![HTML5 / Canvas](https://img.shields.io/badge/Tech-HTML5_Canvas_|_JavaScript-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Open Source](https://img.shields.io/badge/Open_Source-GitHub-blue.svg)](https://github.com/kiranmayee-abbireddy/angry-cats)

An open-source physics arcade game inspired by *Angry Birds*. Instead of birds, launch a roster of furious cats with special abilities to crush dog fortresses and reclaim stolen catnip!

---

## 📸 Preview & Aesthetics

```
      /\_/\   ⚡ (Cat Launch Trajectory)
     ( o.o ) ------------.
      > ^ <               \
                           \  💥 [WOOD] [TNT] [STONE]
                            `------> ( 🐶 Dog Fortress )
```

---

## 🐱 Cat Heroes Roster

| Cat Hero | Ability / Trait | Description |
| :--- | :--- | :--- |
| **Tom (Red)** 😸 | Standard Ballistic | Well-balanced cat shooter. Good accuracy. |
| **Speedy (Yellow)** ⚡ | Turbo Boost | Tap mid-flight for high velocity boost! |
| **Bomb (Black)** 💣 | Explosive Blast | Detonates on impact or on tap mid-flight! |
| **Garfield (Big)** 🦁 | Heavy Wrecker | Extreme mass & impulse to smash stone walls. |

---

## 🐶 Dog Enemies & Destructible Blocks

- **Standard Pugs & Bulldogs**: Weak to medium HP targets.
- **Boss Dogs**: Wearing crowns/helmets with high health!
- **Wood Blocks**: Easily broken by speed cats.
- **Glass Blocks**: Weak structural support.
- **Stone Blocks**: High durability, broken best by Garfield.
- **TNT Crates**: Causes massive chain reaction explosions when struck!

---

## 🚀 How to Play

1. **Pull & Aim**: Click/Touch and drag backwards on the slingshot to aim.
2. **Release**: Let go to launch the active Cat.
3. **Special Abilities**: Tap/Click anywhere while a cat is in flight to trigger its power (e.g. Yellow Turbo Speed or Bomb Explosion).
4. **Win Condition**: Destroy all Dogs on the level to clear the stage and unlock higher highscores!

---

## 💻 Local Setup & Running

No complex build step or heavy dependencies required! 

1. **Clone repository**:
   ```bash
   git clone git@github.com:kiranmayee-abbireddy/angry-cats.git
   cd angry-cats
   ```

2. **Run Web Server**:
   Open `index.html` directly in any modern browser, or use VS Code Live Server / `npx serve`:
   ```bash
   npx serve .
   ```

---

## 🛠️ Built With

- **HTML5 Canvas**: Smooth 60 FPS 2D rendering.
- **Pure JavaScript ES6+**: Custom rigid body physics and trajectory prediction.
- **Web Audio API**: Built-in sound synthesis for slingshot launch, impacts, and dog barks without external mp3 files.
- **Vanilla CSS**: Responsive glassmorphism overlay system.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more details.
