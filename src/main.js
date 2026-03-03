import { CONTROLS, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, CORE_X, ENGAGEMENT_X, GAME_VERSION } from './constants.js';
import { audioCtx, sounds, playSound } from './audio.js';
import { highScore, updateHighScore, createExplosion, findPath, updateGridRect } from './utils.js';
import { spawnEnemy, spawnDrone, spawnHealBot, spawnDecoy, spawnMeteor, build, dropResource, spawnSonicWave } from './entities.js';
import { createSystems } from './systems.js';
import { showBanner, showUpgradePicker } from './ui.js';
import { UPGRADE_CARDS } from './cards.js';
import { initDebugUI } from './debug.js';

initDebugUI();

// Aspect Ratio Detection for Desktop/Mobile and Embedded (iframe) support
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth < window.innerHeight && window.innerWidth < 600);
const viewWidth = isMobile ? 360 : MAP_WIDTH;
const viewHeight = isMobile ? 640 : MAP_HEIGHT;

kaboom({
    background: [10, 10, 15],
    width: viewWidth,
    height: viewHeight,
    letterbox: true,
    texFilter: "nearest",
    pixelDensity: Math.min(window.devicePixelRatio, 2), // Limit to 2x for performance
});

// --- CRITICAL ASSETS (Loaded upfront) ---
loadSprite("title_logo", "assets/title_logo.png");
loadSprite("girl", "assets/girl.png");
loadSound("bgm_title", "assets/bgm_title.mp3");

// --- DEFERRED ASSETS (Loaded while user is on Title/Intro) ---
let gameAssetsLoaded = false;
let totalAssets = 30; // Estimated count of deferred assets
function loadGameAssets() {
    if (gameAssetsLoaded) return;
    gameAssetsLoaded = true; // Set early to prevent double trigger
    console.log("Lazy loading game assets started...");
    const startTime = performance.now();

    // Sprites
    loadSprite("wide_map", "assets/wide_map_b64.png");
    loadSprite("player", "assets/player_b64.png");
    loadSprite("enemy", "assets/enemy.png");
    loadSprite("scrap", "assets/scrap.png");
    loadSprite("battery", "assets/battery.png");
    // loadSprite("explosion", "assets/explosion.png");
    // loadSprite("obs_ruins", "assets/obs_ruins.png"); // Unused
    // loadSprite("obs_car", "assets/obs_car.png"); // Unused
    // loadSprite("obs_playground", "assets/obs_playground.png"); // Unused
    // loadSprite("obs_ground", "assets/obs_ground.png"); // Unused
    // loadSprite("turret", "assets/new_turret.png"); // Redundant (lvl1 is used)
    loadSprite("turret_lvl1", "assets/turret_lvl1.png");
    loadSprite("turret_lvl5", "assets/turret_lvl5.png");
    loadSprite("turret_lvl10", "assets/turret_lvl10.png");
    loadSprite("turret_lvl20", "assets/turret_lvl20.png");
    loadSprite("turret_lvl30", "assets/turret_lvl30.png");
    loadSprite("turret_lvl40", "assets/turret_lvl40.png");
    loadSprite("turret_lvl50", "assets/turret_lvl50.png");
    loadSprite("enemy_warp", "assets/enemy_warp.png");
    loadSprite("enemy_jammer", "assets/enemy_jammer.png");
    loadSprite("drone", "assets/drone.png");
    loadSprite("enemy_assassin", "assets/enemy_assassin.png");
    loadSprite("heal_bot", "assets/heal_bot.png");
    loadSprite("obs_large", "assets/obs_large.png");
    // loadSprite("wall", "assets/wall.png");
    loadSprite("obs_character", "assets/obs_character.png");
    loadSprite("obs_tall", "assets/obs_tall.png");

    // Sounds
    loadSound("bgm_day", "assets/bgm_day.mp3");
    loadSound("bgm_night", "assets/bgm_night.mp3");
    loadSound("bgm_gameover", "assets/bgm_gameover.mp3");

    onLoad(() => {
        console.log(`All assets loaded in ${((performance.now() - startTime) / 1000).toFixed(2)}s`);
    });
}

export function getTurretSprite(level) {
    if (level >= 50) return "turret_lvl50";
    if (level >= 40) return "turret_lvl40";
    if (level >= 30) return "turret_lvl30";
    if (level >= 20) return "turret_lvl20";
    if (level >= 10) return "turret_lvl10";
    if (level >= 5) return "turret_lvl5";
    return "turret_lvl1";
}

// Game State Initialization
function getInitialGameState() {
    return {
        currentWave: 1,
        phase: "day",
        dayTimer: 0,
        enemiesInWave: 0,
        enemiesSpawned: 0,
        currentBgm: null,
        upgrades: {
            pickupRadius: 100,
            pickupRadiusMod: 1.0,
            chainLightning: 0,
            explosiveRounds: 0,
            bulletSizeMod: 1.0,
            maxTurrets: 3,
            turretCooldown: 5.0,
            turretCooldownMod: 1.0,
            pierce: 0,
            multiShot: 0,
            homing: 0,
            critChance: 0,
            turretHpMod: 1.0,
            turretFireRateMod: 1.0,
            turretRangeMod: 1.0,
            turretDmgMod: 1.0,
            roboCircus: 0,
            ricochet: 0,
            drone: 0,
            droneLvl: 0,
            healBot: 0,
            orbitingProjectiles: 0,
            omegaStrike: 0,
            holographicDecoy: 0,
            meteorFall: 0,
            sonicWave: 0,
            sonicWaveLvl: 0,
        },
        activeTurrets: 0,
        turretCooldownTimer: 0,
        phaseLabel: null,
        xp: 0,
        level: 1,
        xpToNext: 10,
        meteorTimer: 10, // First meteor comes soon after picking
        paused: false,
        jammingTimer: 0,
        spawnedEnemyTypes: [],
    };
}

let gameState = getInitialGameState();

const debugWaveSkip = () => {
    const waveInput = prompt("開始ウェーブを入力してください (1-99):", "1");
    const waveNum = parseInt(waveInput);
    if (!isNaN(waveNum) && waveNum > 0) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        sounds.waveStart();
        go("main", { startWave: waveNum });
    }
};

scene("intro", () => {
    loadGameAssets();
    const status = add([
        text("LOADING...", { size: 16, font: "monospace" }),
        pos(width() / 2, height() / 2 + 40),
        anchor("center"),
        color(150, 150, 150),
    ]);
    
    const clickMsg = add([
        text("CLICK TO START", { size: isMobile ? 24 : 32, font: "monospace" }),
        pos(width() / 2, height() / 2),
        anchor("center"),
        color(255, 255, 255),
        opacity(0),
    ]);

    onUpdate(() => {
        const prog = loadProgress();
        if (prog < 1) {
            status.text = `LOADING ASSETS... ${Math.round(prog * 100)}%`;
        } else {
            status.text = "ASSETS READY";
            status.opacity = wave(0.2, 0.5, time() * 2);
            clickMsg.opacity = 1;
        }
    });

    onClick(() => { 
        if (loadProgress() < 1) return; // Prevent start before assets
        if (audioCtx.state === 'suspended') audioCtx.resume(); 
        go("start"); 
    });
    onKeyPress((key) => { 
        if (loadProgress() < 1) return;
        if (key === "p") debugWaveSkip(); 
        else { if (audioCtx.state === 'suspended') audioCtx.resume(); go("start"); } 
    });
});

scene("start", () => {
    loadGameAssets();
    if (gameState.currentBgm) { gameState.currentBgm.stop(); gameState.currentBgm = null; }
    gameState.currentBgm = play("bgm_title", { loop: true, volume: 0.5 });
    add([sprite("title_logo"), pos(width() / 2, height() / 2 - 120), anchor("center"), scale(0.8)]);
    add([sprite("girl"), pos(width() / 2, height() / 2 + 50), scale(0.25), anchor("center")]);
    const startMsg = add([text("PRESS SPACE OR TAP TO INITIALIZE", { size: isMobile ? 16 : 24, font: "monospace" }), pos(width() / 2, height() / 2 + 160), anchor("center")]);
    add([text("BEST RECORD: WAVE " + highScore, { size: 16, font: "monospace" }), pos(width() / 2, height() / 2 + 200), anchor("center"), color(255, 255, 0)]);
    add([text("ver " + GAME_VERSION, { size: 14, font: "monospace" }), pos(width() / 2, height() - 20), anchor("center"), color(150, 150, 150), fixed()]);
    onUpdate(() => startMsg.opacity = wave(0.3, 1, time() * 5));
    const startGame = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); sounds.waveStart(); go("main", { startWave: 1 }); };
    onKeyPress("space", startGame);
    onClick(startGame);
    onKeyPress("p", debugWaveSkip);
});

scene("main", ({ startWave } = { startWave: 1 }) => {
    gameState = getInitialGameState();
    gameState.currentWave = startWave;
    let delta = 0;
    onUpdate(() => { delta = Math.min(dt(), 0.1); });
    add([sprite("wide_map", { width: MAP_WIDTH, height: MAP_HEIGHT }), pos(0, 0), z(-1)]);

    // Performance Optimization: Cache entities globally for the current frame
    let frameEnemies = [];
    let frameResources = [];
    onUpdate(() => {
        frameEnemies = get("enemy");
        frameResources = get("resource");
    });

    // Grid System
    const cols = Math.floor(MAP_WIDTH / TILE_SIZE);
    const rows = Math.floor(MAP_HEIGHT / TILE_SIZE);
    let grid = Array(cols).fill().map(() => Array(rows).fill(0));

    // Layouts
    const layouts = [
        [{ x: 14, y: 6, type: "large" }, { x: 8, y: 2, type: "character" }, { x: 22, y: 11, type: "tall" }, { x: 24, y: 4, type: "character" }],
        [{ x: 16, y: 5, type: "large" }, { x: 10, y: 2, type: "tall" }, { x: 10, y: 11, type: "tall" }, { x: 24, y: 2, type: "tall" }, { x: 24, y: 11, type: "tall" }],
        [{ x: 10, y: 6, type: "large" }, { x: 22, y: 6, type: "large" }, { x: 16, y: 2, type: "character" }, { x: 16, y: 14, type: "character" }]
    ];
    const currentLayout = choose(layouts);
    for (let block of currentLayout) {
        let w = 2, h = 2;
        if (block.type === "large") { w = 4; h = 4; } else if (block.type === "tall") { w = 2; h = 5; }
        updateGridRect(grid, block.x, block.y, w, h, 1);
        add([
            sprite("obs_" + block.type, { width: w * TILE_SIZE, height: h * TILE_SIZE }),
            pos(block.x * TILE_SIZE, block.y * TILE_SIZE),
            area(),
            body({ isStatic: true }),
            "obstacle",
            z(10),
            { obsType: block.type }
        ]);
    }

    // Components (Anchored to World Y for AI stability)
    const girlY = MAP_HEIGHT / 2;
    const girl = add([sprite("girl"), pos(CORE_X, girlY), scale(0.25), area(), anchor("center"), z(90), "girl", { hp: 100, maxHp: 100 }]);
    const girlHpBar = add([rect(100, 10), pos(CORE_X, girlY - 70), color(50, 50, 50), outline(2), anchor("center"), z(1300)]);
    const girlHpFill = girlHpBar.add([rect(100, 10), pos(-50, -5), color(0, 255, 100), anchor("topleft"), z(1301)]);
    add([text("シールド耐久値", { size: 14, font: "monospace" }), pos(CORE_X, girlY - 85), anchor("center"), color(0, 255, 100), z(1302)]);

    const player = add([
        sprite("player", { width: 80, height: 80 }),
        pos(250, girlY),
        area({ scale: 0.6 }),
        body(),
        anchor("center"),
        z(120),
        "player",
        {
            speed: 200,
            targetPos: null,
            lastTapTime: 0,
        }
    ]);

    // XP Bar
    const xpBarBg = add([
        rect(width(), 8),
        pos(0, 80),
        color(30, 30, 50),
        fixed(),
        z(1000)
    ]);
    const xpBarFill = xpBarBg.add([
        rect(0, 8),
        color(0, 200, 255),
    ]);

    // Bottom UI Line (Match top XP bar style)
    add([
        rect(width(), 8),
        pos(0, height() - 88),
        color(30, 30, 50),
        fixed(),
        z(1000)
    ]);

    const hudLevel = add([
        text("LEVEL 1", { size: isMobile ? 18 : 20, font: "monospace" }),
        pos(isMobile ? 10 : 20, isMobile ? 15 : 68),
        anchor("left"),
        fixed(),
        z(1100),
        color(255, 255, 255),
        outline(2, rgb(0, 0, 0))
    ]);

    const waveCounterLabel = add([
        text("WAVE: 1", { size: isMobile ? 22 : 24, font: "monospace" }),
        pos(isMobile ? width() / 2 : width() - 20, isMobile ? 55 : 65),
        anchor(isMobile ? "center" : "right"),
        fixed(),
        z(1100),
        color(255, 255, 0),
        outline(2, rgb(0, 0, 0))
    ]);

    const systems = createSystems(gameState);
    gameState.phaseLabel = add([
        text("DAY", { size: isMobile ? 28 : 48, font: "monospace", width: isMobile ? width() - 20 : undefined }), 
        pos(width() / 2, height() / 2 - 100), 
        anchor("center"), 
        opacity(0), 
        fixed(), 
        z(1100)
    ]);

    gameState.phaseIndicator = add([
        text("1日目：昼", { size: isMobile ? 22 : 32, font: "monospace" }),
        pos(width() / 2, isMobile ? 15 : 40),
        anchor("center"),
        fixed(),
        z(1100),
        color(0, 255, 100),
        outline(3, rgb(0, 0, 0))
    ]);

    const dayTimerLabel = add([
        text("", { size: isMobile ? 18 : 24, font: "monospace" }),
        pos(width() - 10, isMobile ? 15 : 40),
        anchor("right"),
        fixed(),
        z(1100),
        color(255, 255, 255),
        outline(2, rgb(0, 0, 0))
    ]);


    // Movement Loop
    onUpdate(() => {
        if (gameState.paused) return;
        const s = player.speed;
        if (isKeyDown(CONTROLS.MOVE_UP)) { player.move(0, -s); player.targetPos = null; }
        if (isKeyDown(CONTROLS.MOVE_DOWN)) { player.move(0, s); player.targetPos = null; }
        if (isKeyDown(CONTROLS.MOVE_LEFT)) { player.move(-s, 0); player.flipX = false; player.targetPos = null; }
        if (isKeyDown(CONTROLS.MOVE_RIGHT)) { player.move(s, 0); player.flipX = true; player.targetPos = null; }

        // Tap-to-Move Logic
        if (player.targetPos) {
            const dist = player.pos.dist(player.targetPos);
            if (dist > 5) {
                const dir = player.targetPos.sub(player.pos).unit();
                player.move(dir.scale(s));
                if (dir.x < -0.1) player.flipX = false;
                else if (dir.x > 0.1) player.flipX = true;
            } else {
                player.targetPos = null;
            }
        }

        // Follower Camera for Mobile
        if (isMobile) {
            const cx = Math.max(width() / 2, Math.min(MAP_WIDTH - width() / 2, player.pos.x));
            const cy = Math.max(height() / 2, Math.min(MAP_HEIGHT - height() / 2, player.pos.y));
            camPos(cx, cy);
        }

        // Universal Boundary Clamping (Responsive Sync with Visual Lines)
        // HUD lines are at 88px. Sprite height 80 (radius 40).
        // For feet to touch line top: player.y + 40 = world_line_y.
        // On mobile (640 height), world_line_y = 632. So player.y = 592.
        // MAP_HEIGHT (720) - 592 = 128.
        const marginYTop = 128;
        const marginYBot = 128;
        player.pos.x = Math.max(40, Math.min(MAP_WIDTH - 40, player.pos.x));
        player.pos.y = Math.max(marginYTop, Math.min(MAP_HEIGHT - marginYBot, player.pos.y));

        if (gameState.turretCooldownTimer > 0) gameState.turretCooldownTimer -= delta;
        if (gameState.jammingTimer > 0) gameState.jammingTimer -= delta;

        if (gameState.phase === "day" && !gameState.paused) {
            gameState.dayTimer -= delta;
            if (gameState.dayTimer <= 0) systems.startNight();
        } else if (gameState.phase === "night" && gameState.enemiesSpawned >= gameState.enemiesInWave && get("enemy").length === 0) {
            gameState.phase = "transition";
            console.log("Wave " + gameState.currentWave + " cleared. Transitioning...");
            if (gameState.currentBgm) gameState.currentBgm.stop();
            sounds.warningIn();

            showBanner("安全確保: 脅威の排除を確認", rgb(50, 200, 100), () => {
                sounds.warningOut();
                gameState.currentWave++;
                updateHighScore(gameState.currentWave);
                // Reset counters before starting day
                gameState.enemiesSpawned = 0;
                systems.startDay();
            });
        }
    });

    add([
        fixed(),
        z(5000),
        {
            draw() {
                // --- HUD & Turret UI ---
                const activeCount = get("turret").length;
                const screenTopLeft = camPos().sub(width() / 2, height() / 2);
                const uiX = isMobile ? width() / 2 : screenTopLeft.x + width() / 2;
                const uiY = isMobile ? height() - 44 : screenTopLeft.y + height() - 44;

                // Turret UI Icon
                drawCircle({
                    pos: vec2(uiX - 100, uiY),
                    radius: 25,
                    color: rgb(40, 40, 60),
                    outline: { color: rgb(100, 100, 200), width: 2 },
                    fixed: true
                });

                if (gameState.turretCooldownTimer > 0) {
                    const p = 1 - (gameState.turretCooldownTimer / (gameState.upgrades.turretCooldown / gameState.upgrades.turretCooldownMod));
                    const pts = [vec2(0, 0)];
                    const step = 20;
                    for (let i = 0; i <= p * 360; i += step) {
                        const angle = i - 90;
                        pts.push(vec2(Math.cos(angle * Math.PI / 180) * 25, Math.sin(angle * Math.PI / 180) * 25));
                    }
                    const finalAngle = (p * 360) - 90;
                    pts.push(vec2(Math.cos(finalAngle * Math.PI / 180) * 25, Math.sin(finalAngle * Math.PI / 180) * 25));

                    if (pts.length > 2) {
                        try {
                            drawPoly({
                                pos: vec2(uiX - 100, uiY),
                                pts: pts,
                                color: rgb(0, 255, 255),
                                opacity: 0.6,
                                fixed: true
                            });
                        } catch (e) {
                            drawCircle({
                                pos: vec2(uiX - 100, uiY),
                                radius: 25 * p,
                                color: rgb(0, 255, 255),
                                opacity: 0.4,
                                fixed: true
                            });
                        }
                    }
                } else {
                    drawCircle({
                        pos: vec2(uiX - 100, uiY),
                        radius: 25,
                        color: rgb(0, 255, 255),
                        opacity: 0.3,
                        fixed: true
                    });
                }

                drawSprite({
                    sprite: getTurretSprite(gameState.level),
                    pos: vec2(uiX - 100, uiY),
                    width: 40,
                    height: 40,
                    anchor: "center",
                    opacity: gameState.turretCooldownTimer > 0 ? 0.5 : 1,
                    fixed: true
                });

                drawText({
                    text: "W",
                    size: 16,
                    pos: vec2(uiX - 100, uiY + 32),
                    anchor: "center",
                    font: "monospace",
                    color: rgb(255, 255, 255),
                    outline: { color: rgb(0, 0, 0), width: 1 },
                    fixed: true
                });

                drawText({
                    text: `${activeCount} / ${gameState.upgrades.maxTurrets}`,
                    size: 24,
                    pos: vec2(uiX - 60, uiY),
                    anchor: "left",
                    font: "monospace",
                    color: activeCount >= gameState.upgrades.maxTurrets ? rgb(255, 50, 50) : rgb(255, 255, 255),
                    fixed: true
                });

                // Jamming Screen Effect
                if (gameState.jammingTimer > 0) {
                    const op = wave(0.05, 0.15, time() * 20);
                    drawRect({
                        width: width(),
                        height: height(),
                        pos: vec2(0, 0),
                        color: rgb(200, 200, 255),
                        opacity: op,
                        fixed: true,
                    });
                    for (let i = 0; i < 5; i++) {
                        drawRect({
                            width: width(),
                            height: 2,
                            pos: vec2(0, (time() * 500 + i * 150) % height()),
                            color: rgb(255, 255, 255),
                            opacity: op * 2,
                            fixed: true,
                        });
                    }
                }

                // --- MINI-MAP (Topmost) ---
                if (isMobile) {
                    const mapW = 100;
                    const mapH = 56;
                    const pad = 12;
                    const mX = width() - mapW - pad;
                    const mY = 100;

                    drawRect({
                        width: mapW,
                        height: mapH,
                        pos: vec2(mX, mY),
                        color: rgb(0, 0, 0),
                        opacity: 0.6,
                        outline: { color: rgb(0, 255, 255), width: 1 },
                        fixed: true
                    });

                    const s = mapW / MAP_WIDTH;
                    get("enemy").forEach(e => {
                        drawCircle({
                            pos: vec2(mX + e.pos.x * s, mY + e.pos.y * s),
                            radius: 1.5,
                            color: rgb(255, 50, 50),
                            fixed: true
                        });
                    });

                    const core = get("girl")[0];
                    if (core) {
                        drawCircle({
                            pos: vec2(mX + core.pos.x * s, mY + core.pos.y * s),
                            radius: 2.5,
                            color: rgb(0, 150, 255),
                            fixed: true
                        });
                    }

                    drawCircle({
                        pos: vec2(mX + player.pos.x * s, mY + player.pos.y * s),
                        radius: 2.5,
                        color: rgb(0, 255, 100),
                        fixed: true
                    });
                }
            }
        }
    ]);


    // Touch / Mouse Controls
    onClick(() => {
        if (gameState.paused) return;

        // Check for click on UI or invalid area (Always use screen-space for UI checks)
        const mScreenPos = mousePos();
        if (mScreenPos.y < 88 || mScreenPos.y > height() - 88) return;

        const mPos = isMobile ? toWorld(mScreenPos) : mScreenPos;

        const now = time();
        const timeSinceLastTap = now - player.lastTapTime;
        player.lastTapTime = now;

        // Double Tap on Player to Build
        if (timeSinceLastTap < 0.3 && mPos.dist(player.pos) < 60) {
            player.targetPos = null; // Stop moving if building
            const activeCount = get("turret").length;
            if (activeCount < gameState.upgrades.maxTurrets && gameState.turretCooldownTimer <= 0) {
                const currentSprite = getTurretSprite(gameState.level);
                if (build("turret", player, gameState.upgrades, gameState.level, currentSprite)) {
                    const gx = Math.floor(player.pos.x / TILE_SIZE);
                    const gy = Math.floor(player.pos.y / TILE_SIZE);
                    updateGridRect(grid, gx - 1, gy - 1, 2, 2, 1);
                    gameState.turretCooldownTimer = gameState.upgrades.turretCooldown / gameState.upgrades.turretCooldownMod;
                    const newTurret = get("turret").slice(-1)[0];
                    if (newTurret) spawnOrbiters(newTurret);
                    wait(0.1, () => {
                        get("enemy").forEach((e, i) => {
                            wait(i * 0.02, () => { if (e.exists()) e.trigger("recalc_path"); });
                        });
                    });
                }
            }
            return;
        }

        // Single Tap to Move
        player.targetPos = mPos;

        // Visual Feedback for click
        const ring = add([
            circle(15),
            pos(mPos),
            anchor("center"),
            color(0, 255, 255),
            opacity(0.5),
            outline(2, rgb(255, 255, 255)),
            z(200),
            scale(0.5)
        ]);
        ring.onUpdate(() => {
            ring.scale = ring.scale.add(vec2(dt() * 2));
            ring.opacity -= dt() * 3;
            if (ring.opacity <= 0) destroy(ring);
        });
    });

    onKeyPress(CONTROLS.BUILD_TURRET, () => {
        const activeCount = get("turret").length;
        if (activeCount < gameState.upgrades.maxTurrets && gameState.turretCooldownTimer <= 0) {
            const currentSprite = getTurretSprite(gameState.level);
            if (build("turret", player, gameState.upgrades, gameState.level, currentSprite)) {
                // Update grid for pathfinding
                const gx = Math.floor(player.pos.x / TILE_SIZE);
                const gy = Math.floor(player.pos.y / TILE_SIZE);
                updateGridRect(grid, gx - 1, gy - 1, 2, 2, 1);

                gameState.turretCooldownTimer = gameState.upgrades.turretCooldown / gameState.upgrades.turretCooldownMod;

                // Spawn orbiters for new turret
                const newTurret = get("turret").slice(-1)[0];
                if (newTurret) spawnOrbiters(newTurret);

                // Trigger path update for enemies, but stagger it to avoid spike
                wait(0.1, () => {
                    get("enemy").forEach((e, i) => {
                        wait(i * 0.02, () => {
                            if (e.exists()) e.trigger("recalc_path");
                        });
                    });
                });
            }
        }
    });

    // Enemy AI & Pathing
    on("recalc_path", "enemy", (e) => {
        const path = findPath(grid, vec2(e.pos.x - 20, e.pos.y), vec2(CORE_X, height() / 2 + (e.targetOffset || 0)));
        if (path && path.length > 0) e.path = path;
    });

    onAdd("enemy", (e) => e.trigger("recalc_path"));

    onUpdate("enemy", (e) => {
        // Stop NaN propagation immediately
        if (!Number.isFinite(e.pos.x) || !Number.isFinite(e.pos.y)) {
            destroy(e);
            return;
        }

        const coreY = MAP_HEIGHT / 2;
        let targetPos = vec2(CORE_X, coreY + (e.pos.x < 300 ? 0 : (e.targetOffset || 0)));
        const decoys = get("decoy");
        
        // Target Decoy if it exists and is within a reasonable "distraction" range
        let isDecoyTarget = false;
        if (decoys.length > 0 && e.pos.x > CORE_X) {
            const decoy = decoys[0];
            if (e.pos.dist(decoy.pos) < 600) {
                targetPos = decoy.pos.add(vec2(0, e.targetOffset || 0));
                isDecoyTarget = true;
                e.wasTargetingDecoy = true;

                // Fallback: Immediate collision if extremely close to decoy (prevents jitter/pass-through)
                if (e.pos.dist(decoy.pos) < 30) {
                    e.trigger("collide", decoy);
                }
            }
        }

        // If we were targeting a decoy but it's gone, recalc path immediately
        if (!isDecoyTarget && e.wasTargetingDecoy) {
            e.wasTargetingDecoy = false;
            e.trigger("recalc_path");
        }

        // 1. Clamp targetPos itself (AI Intent) to stay withinplayable bands
        targetPos.y = clamp(targetPos.y, 130, height() - 130);

        let dir = vec2(-1, 0);
        if (!gameState.paused) {
            const distToTarget = targetPos.dist(e.pos);

            // Priority: If targeting decoy, ignore pre-calculated path to core
            if (isDecoyTarget) {
                const diff = targetPos.sub(e.pos);
                if (diff.len() > 0.1) dir = diff.unit();
            } else if (e.path && e.path.length > 0) {
                if (e.pos.dist(e.path[0]) < 25) { 
                    e.path.shift(); 
                    if (e.path.length > 0) targetPos = e.path[0]; 
                } else {
                    targetPos = e.path[0];
                }
                const diff = targetPos.sub(e.pos);
                if (diff.len() > 0.1) dir = diff.unit();
            } else { 
                if (rand() < 0.05) e.trigger("recalc_path"); 
            }

            if (dir.x < -0.1) e.flipX = true; else if (dir.x > 0.1) e.flipX = false;
            
            // Apply separation only if not extremely close to target (prevents vibration at destination)
            let sepX = 0;
            let sepY = 0;
            if (distToTarget > 30) {
                // Optimization: Raw math separation (NO VECTOR ALLOCATIONS)
                const ex = e.pos.x;
                const ey = e.pos.y;
                for (let i = 0; i < frameEnemies.length; i++) {
                    const other = frameEnemies[i];
                    if (other === e || !other.exists()) continue;
                    const ox = other.pos.x;
                    const oy = other.pos.y;
                    const dx = ex - ox;
                    const dy = ey - oy;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < 2000 && distSq > 0.1) { // dist < ~45
                        const dist = Math.sqrt(distSq);
                        let forceX = (dx / dist) * 0.6;
                        let forceY = (dy / dist) * 0.6;

                        // 2. Dampen forces that push OUT of bounds
                        if (ey < 140 && forceY < 0) forceY *= 0.1;
                        if (ey > height() - 140 && forceY > 0) forceY *= 0.1;

                        sepX += forceX;
                        sepY += forceY;
                    }
                }
            }
            
            // Reduced randomness when near target
            const randAmp = distToTarget < 50 ? 0.1 : 0.5;
            dir = vec2(dir.x + sepX + rand(-randAmp, randAmp), dir.y + sepY + rand(-randAmp, randAmp));

            const corePos = vec2(CORE_X, MAP_HEIGHT / 2);
            if (e.is("ranged") && e.pos.dist(corePos) < e.stopDistance) {
                e.reloadTimer -= delta;
                if (e.reloadTimer <= 0) { 
                    spawnMortar(e.pos, corePos, girl, girlHpFill, () => go("gameover", { finalWave: gameState.currentWave })); 
                    e.reloadTimer = 5.0; 
                }
                return;
            }
            if (e.is("boss")) { 
                e.stepTimer += delta; 
                if (e.stepTimer >= 1.2) { sounds.bossStep(); e.stepTimer = 0; } 
            }

            const moveDir = dir.unit();
            if (!isNaN(moveDir.x) && !isNaN(moveDir.y)) {
                // 3. Ensure a minimum forward movement if trapped vertically
                let finalMove = moveDir.scale(e.speed);
                if (Math.abs(finalMove.x) < 5) finalMove.x = -10; 
                e.move(finalMove);
            } else {
                e.move(vec2(-1, 0).scale(e.speed)); // Fallback move
            }

            // 4. Final Position Clamp (Safety net)
            e.pos.y = clamp(e.pos.y, 120, height() - 120);
        }

        const engX = e.is("boss") ? (e.pos.x - 250) : e.pos.x;
        if (engX <= ENGAGEMENT_X) {
            if (e.is("boss")) girl.hp = 0; else girl.hp -= 15;
            girlHpFill.width = Math.max(0, (girl.hp / girl.maxHp) * 100);
            shake(20); sounds.damage(); createExplosion(e.pos, gameState.level); sounds.explode(gameState.level); destroy(e);
            if (girl.hp <= 0) go("gameover", { finalWave: gameState.currentWave });
        }
    });

    onCollide("enemy", "decoy", (e, d) => {
        if (gameState.paused) return;
        
        // Damage scaling: Heavy/Boss = 3, Others = 1
        const damage = (e.is("heavy") || e.is("boss")) ? 3 : 1;
        
        d.hp -= damage;
        
        // Enemy effects
        createExplosion(e.pos, gameState.level);
        sounds.explode(gameState.level);
        destroy(e);
        
        if (d.hp <= 0) {
            createExplosion(d.pos, gameState.level);
            sounds.explode();
            destroy(d);
        }
    });

    onCollide("enemy", "building", (e, b) => {
        if (gameState.paused) return;
        if (b.is("turret")) {
            let damage = 1;
            if (e.is("assassin")) damage = b.maxHp * 0.8;
            b.hp -= damage; // Take damage from collision
            const hpbar = b.get("hpbar")[0];
            if (hpbar) hpbar.width = (b.hp / b.maxHp) * 40;
            if (b.hp <= 0) {
                // Remove from grid
                const gx = Math.floor(b.pos.x / TILE_SIZE);
                const gy = Math.floor(b.pos.y / TILE_SIZE);
                updateGridRect(grid, gx - 1, gy - 1, 2, 2, 0);

                createExplosion(b.pos, gameState.level);
                sounds.explode(gameState.level);
                destroy(b);
            }
        } else {
            // Other buildings (walls etc) might still be instant or have different HP
            createExplosion(b.pos, gameState.level);
            sounds.explode(gameState.level);
            destroy(b);
        }
        shake(5);
    });

    onCollide("enemy", "drone", (e, d) => {
        if (gameState.paused) return;
        d.hp -= 1;
        if (d.hp <= 0) {
            createExplosion(d.pos, gameState.level);
            sounds.explode(gameState.level);
            destroy(d);
        }
    });

    onUpdate("turret", (t) => {
        if (gameState.paused || gameState.jammingTimer > 0) return;
        const delta = Math.min(dt(), 0.1);
        t.timer += delta;
        
        // Sonic Wave Logic (v3.6.0)
        if (gameState.upgrades.sonicWave > 0) {
            t.sonicTimer = (t.sonicTimer || 5.0) - delta;
            if (t.sonicTimer <= 0) {
                t.sonicTimer = 5.0;
                // Find target for sonic wave (closest enemy)
                let sonicTarget = null;
                let sonicMinDist = 1000;
                for (const e of frameEnemies) {
                    const d = t.pos.dist(e.pos);
                    if (d < sonicMinDist) { sonicMinDist = d; sonicTarget = e; }
                }
                spawnSonicWave(t, sonicTarget, gameState);
                sounds.sonic(); // Use dedicated sonic sound (v3.6.3)
            }
        }

        // Visual Evolution: Update sprite based on current level milestone
        const currentSpriteName = getTurretSprite(gameState.level);
        if (t.evolutionStage !== currentSpriteName) {
            t.evolutionStage = currentSpriteName;
            t.use(sprite(currentSpriteName, { width: 80, height: 80 }));
        }
        // Apply Additive Multipliers: Speed = Base / Mod, Values = Base * Mod
        const effectiveFireRate = t.fireRate / gameState.upgrades.turretFireRateMod;
        const effectiveRange = t.range * gameState.upgrades.turretRangeMod;
        const effectiveDmg = t.dmg * gameState.upgrades.turretDmgMod;

        if (t.timer >= effectiveFireRate) {
            const enemies = frameEnemies; // Performance Optimization: use cached enemies
            if (enemies.length > 0) {
                let closest = null;
                let minDist = effectiveRange;
                for (const e of enemies) {
                    let d = t.pos.dist(e.pos);
                    if (e.is("boss")) d = Math.max(0, d - 250);
                    if (d < minDist) { minDist = d; closest = e; }
                }

                if (closest) {
                    const firePos = t.pos;
                    t.timer = 0;

                    const isOmegaLaser = (gameState.upgrades.omegaStrike > 0 && t.firstShot);
                    if (isOmegaLaser) {
                        t.firstShot = false;
                        // Fire massive laser
                        const diff = closest.pos.sub(t.pos);
                        const dir = diff.len() > 0.1 ? diff.unit() : vec2(-1, 0);
                        const beamLength = 1500;
                        const beam = add([
                            rect(beamLength, 40),
                            pos(t.pos),
                            rotate(dir.angle()),
                            anchor("left"), // Grow from turret
                            color(200, 255, 255),
                            opacity(1),
                            area(),
                            z(95),
                            "laser_beam",
                            { dmg: 50 }
                        ]);
                        beam.onUpdate(() => {
                            beam.opacity -= delta * 5;
                            if (beam.opacity <= 0) destroy(beam);
                        });
                        sounds.laser();
                    } else {
                        // Support for Multi-Shot: Ensure center bullet + side pairs
                    const shots = 1 + (gameState.upgrades.multiShot * 2);
                    const spread = 15; // Slightly tighter spread for better concentration

                    for (let i = 0; i < shots; i++) {
                        const diff = closest.pos.sub(firePos);
                        if (diff.len() < 0.1) continue; // Skip shots if perfectly overlapping
                        const baseAngle = diff.angle();
                        const angleOff = (i - (shots - 1) / 2) * spread;
                        const finalAngle = baseAngle + angleOff;
                        const d = vec2(Math.cos(finalAngle * Math.PI / 180), Math.sin(finalAngle * Math.PI / 180));

                        // Check for Crit
                        const isCrit = rand() < gameState.upgrades.critChance;
                        const bulletDmg = isCrit ? (effectiveDmg * 2.5) : effectiveDmg;
                        const bulletColor = isCrit ? rgb(255, 0, 255) : t.bcol;

                        // Robo Circus Support: Fire 2 bullets if upgraded
                        const roboEnabled = gameState.upgrades.roboCircus > 0;
                        const subShots = roboEnabled ? 2 : 1;

                        for (let j = 0; j < subShots; j++) {
                            const subAngle = roboEnabled ? (j === 0 ? -15 : 15) : 0;
                            const subFinalAngle = finalAngle + subAngle;
                            const subDir = vec2(Math.cos(subFinalAngle * Math.PI / 180), Math.sin(subFinalAngle * Math.PI / 180));

                            const isOmega = gameState.upgrades.omegaStrike > 0;
                            const b = add([
                                rect((isOmega ? 80 : (isCrit ? 18 : 12)) * gameState.upgrades.bulletSizeMod, (isOmega ? 2000 : (isCrit ? 8 : 4)) * gameState.upgrades.bulletSizeMod),
                                pos(firePos),
                                color(isOmega ? rgb(0, 255, 255) : bulletColor),
                                area({ scale: isOmega ? vec2(1, 1) : vec2(2, 2) }),
                                rotate(subFinalAngle),
                                offscreen({ destroy: true, distance: isOmega ? 2000 : 400 }),
                                "bullet",
                                z(95),
                                {
                                    dmg: isOmega ? 10 : bulletDmg,
                                    isCrit: isCrit,
                                    pierce: isOmega ? 999 : gameState.upgrades.pierce,
                                    homing: isOmega ? 0 : gameState.upgrades.homing,
                                    homingScanTimer: rand(0, 0.1),
                                    dir: subDir,
                                    circus: isOmega ? false : roboEnabled,
                                    wobbleTime: rand(0, 10),
                                    ricochet: isOmega ? 0 : gameState.upgrades.ricochet,
                                    source: "turret",
                                    isOmega: isOmega
                                }
                            ]);

                            if (isOmega) {
                                // Add a glowing core to the laser
                                b.add([
                                    rect(20, 2000),
                                    anchor("center"),
                                    color(255, 255, 255),
                                    z(1)
                                ]);
                            }

                            b.onUpdate(() => {
                                if (gameState.paused) return;

                                // Ricochet (Bounce) Logic
                                if (b.ricochet > 0) {
                                    const topLimit = 130;
                                    const bottomLimit = MAP_HEIGHT - 130;
                                    if ((b.pos.y < topLimit && b.dir.y < 0) || (b.pos.y > bottomLimit && b.dir.y > 0)) {
                                        b.dir.y = -b.dir.y;
                                        b.angle = b.dir.angle();
                                        b.ricochet--;
                                        b.pos.y = b.pos.y < topLimit ? topLimit + 2 : bottomLimit - 2;
                                        if (sounds && sounds.hit) sounds.hit();
                                    }
                                }

                                if (gameState.upgrades.homing > 0 && b.source === "turret") {
                                    if (b.circus) b.wobbleTime += dt() * 15;

                                    // Optimization: Only lookup target every few frames or if target missing
                                    b.homingScanTimer = (b.homingScanTimer || 0) - dt();

                                    if (!b.targetEnemy || !b.targetEnemy.exists() || b.homingScanTimer <= 0) {
                                        b.homingScanTimer = 0.1; // Scan 10 times a second
                                        const targets = frameEnemies;
                                        if (targets.length > 0) {
                                            let targetClosest = null;
                                            let targetMinDist = 700;
                                            for (const te of targets) {
                                                const td = b.pos.dist(te.pos);
                                                if (td < targetMinDist) { targetMinDist = td; targetClosest = te; }
                                            }
                                            b.targetEnemy = targetClosest;
                                        }
                                    }

                                    if (b.targetEnemy && b.targetEnemy.exists()) {
                                        const targetClosest = b.targetEnemy;
                                        const tx = targetClosest.pos.x;
                                        const ty = targetClosest.pos.y;
                                        const bx = b.pos.x;
                                        const by = b.pos.y;
                                        const dx = tx - bx;
                                        const dy = ty - by;
                                        const distSq = dx * dx + dy * dy;

                                        if (distSq > 0.01) {
                                            const dist = Math.sqrt(distSq);
                                            let targetDirX = dx / dist;
                                            let targetDirY = dy / dist;

                                            if (b.circus) {
                                                const amp = map(dist, 0, 300, 5, 40);
                                                const wobbleAngle = (Math.atan2(targetDirY, targetDirX) * 180 / Math.PI) + 90 + Math.sin(b.wobbleTime) * amp;
                                                const wobbleX = Math.cos(wobbleAngle * Math.PI / 180) * 0.6;
                                                const wobbleY = Math.sin(wobbleAngle * Math.PI / 180) * 0.6;
                                                const wx = targetDirX + wobbleX;
                                                const wy = targetDirY + wobbleY;
                                                const wdist = Math.sqrt(wx * wx + wy * wy);
                                                if (wdist > 0.001) {
                                                    targetDirX = wx / wdist;
                                                    targetDirY = wy / wdist;
                                                }
                                            }

                                            const turnSpeed = map(dist, 0, 600, 60, 10);
                                            const lerpFactor = dt() * turnSpeed;
                                            const newDirX = b.dir.x + (targetDirX - b.dir.x) * lerpFactor;
                                            const newDirY = b.dir.y + (targetDirY - b.dir.y) * lerpFactor;
                                            const newDist = Math.sqrt(newDirX * newDirX + newDirY * newDirY);

                                            if (newDist > 0.001) {
                                                b.dir = vec2(newDirX / newDist, newDirY / newDist);
                                                b.angle = b.dir.angle();
                                            }
                                            if (dist < 20) b.dir = vec2(targetDirX, targetDirY); // Snap
                                        }
                                    }
                                }

                                const speed = b.homing > 0 ? (b.circus ? 850 : 750) : 1100;
                                b.move(b.dir.scale(speed));
                            }); // End b.onUpdate
                        } // End for subShots
                    } // End for shots
                } // End if (closest)

                sounds.shoot();

                // Consume HP per shot (restored lifetime mechanic)
                t.hp -= 1;
                const hpbar = t.get("hpbar")[0];
                if (hpbar) hpbar.width = (t.hp / t.maxHp) * 40;

                if (t.hp <= 0) {
                    createExplosion(firePos, gameState.level);
                    sounds.explode(gameState.level);
                    destroy(t);
                    return;
                }
            } // End if closest
        } // End if enemies.length > 0
    } // End if t.timer >= effectiveFireRate
});

    // Helper function to apply damage to an enemy, considering shields and handling death
    const applyDamage = (e, dmg, isHit = true) => {
        if (!e || !e.exists() || e.hp <= 0 || isNaN(dmg)) return;

        // Handle Shield (Barrier) Logic
        if (e.shieldHP > 0) {
            if (isHit) {
                e.shieldHP -= 1; // Shields block "hits"
                const shieldLabel = e.get("shield_label")[0];
                if (shieldLabel) shieldLabel.text = e.shieldHP;

                if (e.shieldHP <= 0) {
                    const sv = e.get("shield_visual")[0];
                    if (sv) destroy(sv);
                    const sl = e.get("shield_label")[0];
                    if (sl) destroy(sl);
                    sounds.explode(); // Barrier break sound
                } else {
                    if (sounds.hit) sounds.hit(); // Standard hit sound
                }
            }
            return; // Block damage while shield is active
        }

        // Standard damage
        e.hp -= dmg;
        
        if (e.is("decoy")) {
            if (e.hp <= 0) {
                createExplosion(e.pos, gameState.level);
                sounds.explode();
                destroy(e);
            }
            return;
        }

        updateEnemyHpBar(e);

        if (e.hp <= 0 && e.exists()) {
            const diePos = vec2(e.pos.x, e.pos.y);
            // Final sanity check for death position
            if (Number.isFinite(diePos.x) && Number.isFinite(diePos.y)) {
                destroy(e);
                createExplosion(diePos, gameState.level);
                sounds.explode(gameState.level);
                dropResource(diePos, gameState.level);
            } else {
                destroy(e);
            }
        }
    };

    onCollide("laser_beam", "enemy", (l, e) => {
        applyDamage(e, l.dmg, false); // Lasers ignore hit-count shields or bypass them? Let's say bypass for romantics.
    });

    onCollide("bullet", "enemy", (b, e) => {
        if (gameState.paused || !b.exists()) return; 

        // Calculate effects BEFORE primary damage so they trigger on lethal shots
        const splashEnabled = gameState.upgrades.explosiveRounds > 0 && b.source === "turret";
        const chainEnabled = gameState.upgrades.chainLightning > 0 && b.source === "turret";
        const impactPos = e.pos;

        if (b.pierce <= 0) {
            destroy(b);
        } else {
            b.pierce--;
        }

        if (b.isCrit) {
            sounds.explode(); // Flashier sound for crit
            shake(5);
        }

        applyDamage(e, b.dmg, true);

        // Explosive Rounds
        if (splashEnabled && (!e.exists() || e.shieldHP <= 0)) {
            const range = 80 + (gameState.upgrades.explosiveRounds * 20);
            createExplosion(impactPos, gameState.level);
            frameEnemies.forEach(other => {
                if (other !== e && other.pos.dist(impactPos) < range) {
                    applyDamage(other, b.dmg * 0.5, true);
                }
            });
        }

        // Chain Lightning
        if (chainEnabled && e.hp > 0 && (!e.exists() || e.shieldHP <= 0)) {
            let chainCount = gameState.upgrades.chainLightning;
            let currentTarget = e;
            const hitEnemies = new Set([e]);
            for (let i = 0; i < chainCount; i++) {
                const targets = frameEnemies.filter(other => !hitEnemies.has(other) && other.pos.dist(currentTarget.pos) < 200);
                if (targets.length > 0) {
                    const nextTarget = targets[0];
                    hitEnemies.add(nextTarget);
                    const lineDiff = nextTarget.pos.sub(currentTarget.pos);
                    const lineAngle = lineDiff.len() > 0.1 ? lineDiff.angle() : 0;
                    const l = add([
                        rect(currentTarget.pos.dist(nextTarget.pos), 2),
                        pos(currentTarget.pos), rotate(lineAngle),
                        color(0, 255, 255), opacity(1), z(110),
                    ]);
                    l.onUpdate(() => { l.opacity -= dt() * 5; if (l.opacity <= 0) destroy(l); });
                    applyDamage(nextTarget, b.dmg * 0.4, true);
                    currentTarget = nextTarget;
                } else break;
            }
        }
    });

    const updateEnemyHpBar = (e) => {
        if (!e || !e.exists()) return;
        const hpbar = e.get("hpbar")[0];
        if (hpbar) {
            let fw = e.is("boss") ? 300 : (e.barW || 30);
            hpbar.width = Math.max(0, (e.hp / e.maxHp) * fw);
        }
    };

    onUpdate(() => {
        const xpRatio = gameState.xp / gameState.xpToNext;
        xpBarFill.width = xpRatio * width();
        hudLevel.text = "LEVEL " + gameState.level;
        waveCounterLabel.text = "WAVE: " + gameState.currentWave;

        if (gameState.phase === "day") {
            dayTimerLabel.text = "NEXT: " + Math.ceil(gameState.dayTimer) + "s";
        } else {
            dayTimerLabel.text = "";
        }

        // Reactive HP Bar update (Fix for Core Repair card UI)
        if (girl && girlHpFill) {
            girlHpFill.width = Math.max(0, (girl.hp / girl.maxHp) * 100);
        }
    });

    const triggerLevelUp = () => {
        if (gameState.paused) return;
        gameState.level++;
        gameState.xpToNext = Math.floor(gameState.xpToNext * 1.15) + 3;
        sounds.upgrade();
        destroyAll("ui_picker");
        showUpgradePicker(gameState, player, girl, UPGRADE_CARDS, null, isMobile);
    };

    onKeyPress("p", triggerLevelUp);

    onCollide("player", "resource", (p, r) => {
        if (gameState.paused) return;
        destroy(r);
        sounds.collect();

        if (r.type === "battery") {
            triggerLevelUp();
        } else {
            // Scrap adds 1 XP
            gameState.xp += 1;
            if (gameState.xp >= gameState.xpToNext) {
                gameState.xp -= gameState.xpToNext;
                triggerLevelUp();
            }
        }
    });

    onUpdate("resource", (r) => {
        if (gameState.paused) return;

        // Harden position at start of update
        if (!Number.isFinite(r.pos.x) || !Number.isFinite(r.pos.y)) {
            destroy(r);
            return;
        }

        // Separation from other resources (Optimized with frameResources and raw math)
        const rx = r.pos.x;
        const ry = r.pos.y;
        let sepX = 0;
        let sepY = 0;

        for (let i = 0; i < frameResources.length; i++) {
            const other = frameResources[i];
            if (other === r || !other.exists()) continue;
            const ox = other.pos.x;
            const oy = other.pos.y;
            const dx = rx - ox;
            const dy = ry - oy;
            const distSq = dx * dx + dy * dy;

            if (distSq < 1225 && distSq > 0.1) { // 35px threshold
                const dist = Math.sqrt(distSq);
                const force = 120 * (1 - dist / 35);
                sepX += (dx / dist) * force;
                sepY += (dy / dist) * force;
            }
        }
        if (sepX !== 0 || sepY !== 0) {
            r.move(sepX, sepY);
        }

        // Attraction to player: Use additive modifier
        const pickupDist = (gameState.upgrades.pickupRadius || 100) * (gameState.upgrades.pickupRadiusMod || 1.0);
        const playerPos = player.pos;
        const pdx = playerPos.x - rx;
        const pdy = playerPos.y - ry;
        const pDistSq = pdx * pdx + pdy * pdy;

        if (pDistSq < pickupDist * pickupDist && pDistSq > 0.1) {
            const pDist = Math.sqrt(pDistSq);
            const pullForce = 350;
            r.move((pdx / pDist) * pullForce, (pdy / pDist) * pullForce);
        }
    });


    function spawnMortar(start, target, girl, girlHpFill, gameOver) {
        const m = add([
            circle(12),
            color(255, 50, 50),
            pos(start),
            area(),
            z(130),
            {
                target: target,
                speed: 300,
                v: 0,
            }
        ]);
        const startDist = start.dist(target);
        m.onUpdate(() => {
            if (gameState.paused) return;
            const d = m.pos.dist(target);
            const moveDir = target.sub(m.pos).unit();
            m.move(moveDir.scale(m.speed));

            // Arc effect
            const progress = 1 - (d / startDist);
            const height = Math.sin(progress * Math.PI) * 150;
            m.scale = vec2(1 + height / 100);

            if (d < 10) {
                createExplosion(m.pos, gameState.level);
                sounds.explode(gameState.level);
                girl.hp -= 20;
                shake(10);
                destroy(m);

                // Damage drones in explosion radius
                get("drone").forEach(drone => {
                    if (drone.pos.dist(m.pos) < 60) {
                        drone.hp -= 1;
                        if (drone.hp <= 0) {
                            createExplosion(drone.pos, gameState.level);
                            sounds.explode(gameState.level);
                            destroy(drone);
                        }
                    }
                });

                if (girl.hp <= 0) gameOver();
            }
        });
    }

    // Heal Bot Persistence Trigger
    let lastHealBotLevel = 0;
    let lastDroneLevel = 0;
    onUpdate(() => {
        const hLevel = gameState.upgrades.healBot;
        if (hLevel !== lastHealBotLevel) {
            lastHealBotLevel = hLevel;
            if (hLevel > 0) spawnHealBot(gameState, sounds);
        }

        // Meteor Fall Logic
        if (gameState.upgrades.meteorFall > 0 && gameState.phase === "night") {
            gameState.meteorTimer -= dt();
            if (gameState.meteorTimer <= 0) {
                gameState.meteorTimer = 18; // 18 seconds interval
                spawnMeteor(gameState, sounds);
            }
        }
    });

    // Orbiting Projectiles (Metal Chunks) logic
    function spawnOrbiters(t) {
        if (!t.exists()) return;
        const count = gameState.upgrades.orbitingProjectiles;
        if (count <= 0) return;

        // Clean up any existing orbiters for this turret first
        get("orbiter").forEach(o => {
            if (o.parentTurret === t) destroy(o);
        });

        for (let i = 0; i < count; i++) {
            const angle = (360 / count) * i;
            add([
                circle(8),
                pos(t.pos.x, t.pos.y),
                color(150, 150, 160),
                outline(2, rgb(80, 80, 80)),
                area(),
                anchor("center"),
                z(96),
                "orbiter",
                {
                    parentTurret: t,
                    angle: angle,
                    orbitDist: 60,
                    dmg: 2
                }
            ]);
        }
    }

    let lastOrbiterLevel = 0;
    onUpdate(() => {
        const oLevel = gameState.upgrades.orbitingProjectiles;
        if (oLevel !== lastOrbiterLevel) {
            lastOrbiterLevel = oLevel;
            get("turret").forEach(t => spawnOrbiters(t));
        }
    });

    onUpdate("orbiter", (o) => {
        if (gameState.paused) return;
        if (!o.parentTurret || !o.parentTurret.exists()) {
            destroy(o);
            return;
        }
        o.angle += dt() * 120; // Rotation speed
        const rad = o.angle * Math.PI / 180;

        // Use raw math for position update to minimize Vec2 creation
        const tx = o.parentTurret.pos.x;
        const ty = o.parentTurret.pos.y;
        o.pos.x = tx + Math.cos(rad) * o.orbitDist;
        o.pos.y = ty + Math.sin(rad) * o.orbitDist;

        // Optimized collision check using frameEnemies
        for (let i = 0; i < frameEnemies.length; i++) {
            const e = frameEnemies[i];
            if (!e.exists()) continue;

            const dx = e.pos.x - o.pos.x;
            const dy = e.pos.y - o.pos.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < 625) { // 25px radius
                applyDamage(e, o.dmg, true);
                createExplosion(o.pos, gameState.level);
                if (sounds.hit) sounds.hit();
                destroy(o);
                break;
            }
        }
    });

    // Handle Wave Start (Refill Orbiters)
    on("start_night", () => {
        get("turret").forEach(t => spawnOrbiters(t));
    });

    systems.startDay();
});

scene("gameover", ({ finalWave }) => {
    if (gameState.currentBgm) gameState.currentBgm.stop();
    gameState.currentBgm = play("bgm_gameover", { loop: true, volume: 0.5 });
    add([text("MISSION FAILED", { size: isMobile ? 32 : 48, font: "monospace" }), pos(width() / 2, height() / 2 - 50), anchor("center"), color(255, 50, 50)]);
    add([text("FINAL WAVE: " + finalWave, { size: 24, font: "monospace" }), pos(width() / 2, height() / 2 + 20), anchor("center")]);
    add([text("PRESS SPACE OR TAP TO RETURN", { size: 16, font: "monospace" }), pos(width() / 2, height() / 2 + 80), anchor("center")]);
    onKeyPress("space", () => go("start"));
    onClick(() => go("start"));
});

go("intro");
