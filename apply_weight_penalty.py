import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Add getSpeed function near player creation
speed_func_code = """
            // Calculate current speed considering weight penalty
            function getSpeed() {
                // Each item slows player down by 15 units.
                // Minimum speed clamped at 50 to prevent getting stuck.
                let penalty = (player.scrapCount + player.batteryCount) * 15;
                return Math.max(50, player.speed - penalty);
            }
"""

text = text.replace('// Movement', speed_func_code + '\n            // プレイヤーの移動制御処理\n            // Movement')

# Update player.move() calls to use getSpeed() instead of player.speed
text = text.replace('player.move(0, -player.speed)', 'player.move(0, -getSpeed())')
text = text.replace('player.move(0, player.speed)', 'player.move(0, getSpeed())')
text = text.replace('player.move(-player.speed, 0)', 'player.move(-getSpeed(), 0)')
text = text.replace('player.move(player.speed, 0)', 'player.move(getSpeed(), 0)')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Weight penalty implemented!")
