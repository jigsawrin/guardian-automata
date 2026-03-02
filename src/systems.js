import { sounds } from './audio.js';
import { showBanner } from './ui.js';
import { spawnEnemy, spawnDrone, spawnHealBot } from './entities.js';

export function createSystems(gameState) {
    console.assert(gameState && typeof gameState.currentWave === 'number', "createSystems: gameState must be an object");

    function startDay() {
        if (gameState.upgrades.drone > 0) spawnDrone(gameState, sounds);
        if (gameState.upgrades.healBot > 0) spawnHealBot(gameState, sounds);
        if (gameState.currentBgm) { gameState.currentBgm.stop(); gameState.currentBgm = null; }
        gameState.currentBgm = play("bgm_day", { loop: true, volume: 0.5 });

        gameState.phase = "day";
        gameState.dayTimer = 10;
        gameState.phaseLabel.text = "DAY " + gameState.currentWave + ": 拠点を強化せよ";
        gameState.phaseLabel.color = rgb(0, 255, 100);
        if (gameState.phaseIndicator) {
            gameState.phaseIndicator.text = gameState.currentWave + "日目：昼";
            gameState.phaseIndicator.color = rgb(0, 255, 100);
        }
        tween(0, 1, 0.5, (v) => gameState.phaseLabel.opacity = v, easings.easeOutQuad);

        wait(2, () => {
            tween(1, 0, 0.5, (v) => gameState.phaseLabel.opacity = v, easings.easeInQuad);
        });
    }

    function startNight() {
        gameState.phase = "transition";
        if (gameState.currentBgm) { gameState.currentBgm.stop(); gameState.currentBgm = null; }
        sounds.warningIn();

        showBanner("WARNING! WARNING!", rgb(255, 0, 0), () => {
            sounds.warningOut();
            get("girl")[0]?.trigger("start_night");
            gameState.phase = "night";
            // Calculate enemy count based on new logic:
            // Base: Wave 1=10, Wave 2=16 (+6)
            // From Wave 3: If wave is multiple of 3, +10. Else +6.
            let count = 10;
            for (let i = 2; i <= gameState.currentWave; i++) {
                if (i % 3 === 0) count += 10;
                else count += 6;
            }
            gameState.enemiesInWave = (gameState.currentWave === 8) ? 1 : count;
            gameState.enemiesSpawned = 0;
            gameState.currentBgm = play("bgm_night", { loop: true, volume: 0.5 });

            gameState.phaseLabel.text = "WAVE " + gameState.currentWave + ": 拠点を死守せよ";
            gameState.phaseLabel.color = rgb(255, 50, 50);
            if (gameState.phaseIndicator) {
                gameState.phaseIndicator.text = gameState.currentWave + "日目：夜";
                gameState.phaseIndicator.color = rgb(255, 50, 50);
            }
            tween(0, 1, 0.5, (v) => gameState.phaseLabel.opacity = v, easings.easeOutQuad);

            wait(2, () => {
                tween(1, 0, 0.5, (v) => gameState.phaseLabel.opacity = v, easings.easeInQuad);
                spawnLoop();
            });
        });
    }

    function spawnLoop() {
        if (gameState.phase !== "night") return;

        if (gameState.paused) {
            wait(0.5, spawnLoop);
            return;
        }

        if (gameState.enemiesSpawned < gameState.enemiesInWave) {
            spawnEnemy(gameState, gameState.enemiesSpawned);
            gameState.enemiesSpawned++;
            const delay = Math.max(0.4, 1.8 - (gameState.currentWave * 0.12));
            wait(delay, spawnLoop);
        }
    }

    return { startDay, startNight, spawnLoop };
}
