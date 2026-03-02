import re

def refactor_index():
    with open('index.html', 'r', encoding='utf-8') as f:
        text = f.read()

    file_map = {
        'map1': 'map1_b64.png',
        'map2': 'map2_b64.png',
        'wide_map': 'wide_map_b64.png',
        'player': 'player_b64.png',
        'enemy': 'enemy.png',
        'turret': 'turret.png',
        'wall': 'wall.png',
        'trap': 'trap.png',
        'scrap': 'scrap.png',
        'obs_ruins': 'obs_ruins.png',
        'obs_car': 'obs_car.png',
        'obs_playground': 'obs_playground.png',
        'obs_ground': 'obs_ground.png',
        'explosion': 'explosion.png',
        'girl': 'girl_spritesheet.png'
    }

    # Remove all existing forms of loadSprite("girl"...) block
    text = re.sub(r'loadSprite\(\s*[\'"]girl[\'"]\s*,\s*[\'"]data:image/png;base64,.*?\}\s*\);', '', text, flags=re.DOTALL)

    def replace_b64(match):
        name = match.group(1)
        if name in file_map:
            return f'// 画像素材の読み込み: {name}\n        loadSprite("{name}", "assets/{file_map[name]}");'
        return f'// 画像素材の読み込み: {name}\n        loadSprite("{name}", "assets/{name}.png");'

    # Replace all simple Base64 loadSprite calls
    text = re.sub(r'loadSprite\(\"([^\"]+)\",\s*\"data:image/[^\"]+\"\);', replace_b64, text)

    # Re-insert the proper loadSprite for girl
    girl_code = """// キャラクター「girl」の読み込み（アニメーション設定）
        loadSprite("girl", "assets/girl_spritesheet.png", {
            sliceX: 8,
            anims: {
                idle: { from: 0, to: 0, speed: 1, loop: false },
                yawn: { from: 0, to: 3, speed: 2, loop: false },
                swing: { from: 4, to: 7, speed: 4, loop: false }
            }
        });"""

    if '// Load Sprites (Step 4)' in text:
        text = text.replace('// Load Sprites (Step 4)', '// スプライト（画像）の読み込み\n' + girl_code)
    else:
        # Fallback insertion
        text = re.sub(r'(kaboom\(\{.*?\}\);)', r'\1\n        ' + girl_code, text, flags=re.DOTALL)

    # Translate comments and add Japanese documentation
    replacements = {
        '// Load Sprites (Step 4)': '// スプライト（画像）の読み込み',
        'scene("start", () => {': '// スタート画面のシーン定義\n        scene("start", () => {',
        'scene("main", () => {': '// メインゲームのシーン定義\n        scene("main", () => {',
        'scene("gameover", (score) => {': '// ゲームオーバー画面のシーン定義\n        scene("gameover", (score) => {',
        '// Grid & Structured Layouts': '// マップのグリッドサイズとレイアウトの構造定義',
        '// Generate Obstacles based on layout': '// レイアウト情報に基づいて障害物を生成する',
        '// A* Pathfinding Implementation': '// A*（エースター）アルゴリズムによる経路探索の実装',
        '// Spawn enemies based on wave': '// ウェーブ数に応じて敵キャラクターを生成',
        '// Player Movement': '// プレイヤーの移動制御処理',
        '// Building Mechanics': '// タワー（砲台）や壁などの建築システムの制御',
        '// Turret AI: Find closest enemy & shoot': '// タワー（砲台）のAI: 最も近い敵を見つけて自動攻撃する処理',
        '// Upgrade System': '// アップグレードシステムの制御',
        '// Toggle Upgrade Menu': '// アップグレードメニューの開閉処理',
        '// Upgrade Selection Logic': '// アップグレード選択時の処理',
        '// Collision & Damage': '// 衝突・ダメージ処理（敵との接触や弾の命中など）',
        '// Wave Management': '// ウェーブ（敵の攻撃フェーズ）の進行管理'
    }

    for old, new in replacements.items():
        if old in text and old != '// Load Sprites (Step 4)': # Skip already replaced
            text = text.replace(old, new)

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(text)
    
    print("Refactoring and cleanup complete!")

if __name__ == "__main__":
    refactor_index()
