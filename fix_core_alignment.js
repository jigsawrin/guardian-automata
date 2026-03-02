const fs = require('fs');

let html = fs.readFileSync('C:\\Users\\nuies\\.gemini\\antigravity\\scratch\\guardian-automata\\index.html', 'utf8');

// Replace base pos
html = html.replace(/const base = add\(\[\s*rect\(140, 140\),\s*pos\(width\(\) \/ 2, height\(\) \/ 2\)/, `const base = add([
                rect(140, 140),
                pos(150, height() / 2)`);

// Replace CORE INTEGRITY pos
html = html.replace(/text\("CORE INTEGRITY", \{ size: 12, font: "monospace" \}\),\s*pos\(width\(\) \/ 2, height\(\) \/ 2 - 75\)/, `text("CORE INTEGRITY", { size: 12, font: "monospace" }),
                pos(150, height() / 2 - 75)`);

fs.writeFileSync('C:\\Users\\nuies\\.gemini\\antigravity\\scratch\\guardian-automata\\index.html', html);
console.log("Core alignment fixed.");
