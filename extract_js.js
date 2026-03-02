const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');
const scripts = html.split('<script>');
// scripts[0] is everything before first <script>
// scripts[1] is kaboom import
// scripts[2] is our game logic, ending with </script>
const gameScript = scripts[2].split('</script>')[0];
fs.writeFileSync('test.js', gameScript);
