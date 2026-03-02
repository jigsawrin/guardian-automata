# Guardian Automata - API List

This document lists all exported constants and functions available in the modular `src/` directory. Refer to this list when making modifications to ensure consistency across the project.

## 1. Constants (`src/constants.js`)

| Name | Description |
| :--- | :--- |
| `CONTROLS` | Object containing keyboard mapping for movements and building. |
| `BUILD_COSTS` | Object defining scrap and battery costs for each building type. |
| `TILE_SIZE` | Size of a grid tile (40px). |
| `MAP_WIDTH` | Total width of the game map (1280px). |
| `MAP_HEIGHT` | Total height of the game map (720px). |
| `CORE_X` | X-coordinate of the Guardian Girl / Core. |
| `ENGAGEMENT_X` | X-coordinate threshold where enemies deal damage to the core. |

## 2. Audio & Sounds (`src/audio.js`)

| Function / Const | Description |
| :--- | :--- |
| `audioCtx` | The global `AudioContext` instance. |
| `playSound(freq, duration, type, volume, freqEnd)` | Basic synthesizer function to play a tone. |
| `sounds` | Collection of pre-defined sound effects (shoot, explode, collect, build, damage, waveStart, upgrade, warningIn/Out, salvage, pyuin, bossStep). |

## 3. Entities & Spawning (`src/entities.js`)

| Function | Description |
| :--- | :--- |
| `dropResource(pos)` | Spawns a scrap or battery resource at the given position. |
| `spawnMortar(start, target, girl, girlHpFill, gameOverCallback)` | Spawns an enemy mortar projectile that follows an arc. |
| `spawnEnemy(currentWave, enemiesSpawned)` | Spawns an enemy (Normal, Heavy, Ranged, or Boss) based on the wave. |
| `build(type, player, upgrades)` | Places a building (turret, sniper, rapid, trap, etc.) at the player's position. |

## 4. UI & Menus (`src/ui.js`)

| Function | Description |
| :--- | :--- |
| `createUpgradeMenu(player, girl, girlHpFill, upgrades)` | Creates the terminal-style upgrade menu accessed via TAB/ESC. |
| `showUpgradePicker(gameState, player, girl, cards, onComplete)` | Displays the 3-card choice menu on level up. |
| `showBanner(bannerTextContent, bgColor, onFinish)` | Shows a sliding text banner (e.g., "WARNING", "SAFETY SECURED"). |

## 5. Game Systems (`src/systems.js`)

| Function | Description |
| :--- | :--- |
| `createSystems(gameState)` | Returns an object with `startDay`, `startNight`, and `spawnLoop` control functions. |

## 6. Utilities (`src/utils.js`)

| Function / Variable | Description |
| :--- | :--- |
| `highScore` | Current high score (Wave number) tracked in `localStorage`. |
| `updateHighScore(wave)` | Updates the high score if the current wave is higher. |
| `getGridCoords(pos)` | Converts screen `vec2` coordinates to grid `x, y`. |
| `heuristic(a, b)` | Calculates Manhattan distance for A* pathfinding. |
| `updateGridRect(grid, gx, gy, gw, gh, val)` | Fills a rectangular area in the grid with a value (0 or 1). |
| `findPath(grid, startPos, endPos)` | A* pathfinding algorithm returning an array of `vec2` waypoints. |
| `createExplosion(pos)` | Spawns a visual circular explosion at the given position. |

---

## 7. Cards (`src/cards.js`)

| Constant | Description |
| :--- | :--- |
| `UPGRADE_CARDS` | Array of upgrade card objects (id, title, desc, effect). |
