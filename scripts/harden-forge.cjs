// One-off source transformation: escape scalar data at HTML output boundaries.
// Keeps static HTML and existing event handlers intact; no rewriting of saved data.
const fs = require('node:fs');
const parser = require('@babel/parser');
const file = 'public/forge.html';
let html = fs.readFileSync(file, 'utf8');
const patches = [];
for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
  const source = match[1]; if (!source.trim()) continue;
  const offset = match.index + match[0].indexOf('>') + 1;
  const ast = parser.parse(source, { sourceType: 'script' });
  const read = n => source.slice(n.start, n.end);
  function dataExpression(n) {
    const s = read(n);
    if (/\b(?:esc|forgeJs|safeImageUrl)\(/.test(s) || /=>|<\w|\.join\(['"]<|innerHTML/.test(s)) return false;
    // Imported character, item and monster fields are not trusted HTML.
    return /^(?:nm|name|desc|type|value|v|maxHP|curHP|dispCA|dispSpd|raceName|clsName|clsIcon|lastScen|dn|txt|label|rarity|imgUrl|sp)$/.test(s) || /\.(?:name|n|player|age|height|weight|eyes|hair|skin|traits|ideals|bonds|flaws|bg_story|notes|desc|description|d|title|citation|rarity|char_name|player_name|class_name|race_name|email|image_alt|found_at|attunement_note|id|level|hp|ac|currentHp|maxHp|qty|sum|speed)\b/.test(s);
  }
  function add(n, before) {
    if (/\bsrc\s*=\s*["']$/.test(before) && !/\b(?:esc|safeImageUrl)\(/.test(read(n))) {
      patches.push({ start: offset + n.start, end: offset + n.end, text: `esc(safeImageUrl(${read(n)}))` });
      return;
    }
    if (!dataExpression(n)) return;
    const event = /\bon\w+\s*=\s*"[^"]*$/.test(before) || /\bon\w+\s*=\s*'[^']*$/.test(before);
    patches.push({ start: offset + n.start, end: offset + n.end, text: `${event ? 'forgeJs' : 'esc'}(${read(n)})` });
  }
  function walk(n, parent) {
    if (!n || typeof n !== 'object') return;
    if (n.type === 'TemplateLiteral' && n.quasis.some(q => /<\/?\w/.test(q.value.cooked || ''))) {
      let prefix = '';
      n.expressions.forEach((expr, i) => { prefix += n.quasis[i].value.cooked || ''; add(expr, prefix); prefix += 'VALUE'; });
    }
    if (n.type === 'BinaryExpression' && n.operator === '+' && !(parent?.type === 'BinaryExpression' && parent.operator === '+')) {
      const parts = []; const flatten = p => { if (p.type === 'BinaryExpression' && p.operator === '+') { flatten(p.left); flatten(p.right); } else parts.push(p); };
      flatten(n);
      if (parts.some(p => p.type === 'StringLiteral' && /<\/?\w/.test(p.value))) {
        let prefix = '';
        for (const p of parts) { if (p.type === 'StringLiteral') prefix += p.value; else { add(p, prefix); prefix += 'VALUE'; } }
      }
    }
    for (const [key, v] of Object.entries(n)) if (!['loc','start','end','extra'].includes(key)) {
      if (Array.isArray(v)) v.forEach(child => walk(child, n)); else if (v && typeof v === 'object') walk(v, n);
    }
  }
  walk(ast);
}
// A surrounding escaped expression already covers its nested expressions.
const selected = patches.filter(p => !patches.some(q => q !== p && q.start <= p.start && q.end >= p.end && (q.start < p.start || q.end > p.end)));
for (const p of selected.sort((a,b) => b.start - a.start)) html = html.slice(0,p.start) + p.text + html.slice(p.end);
fs.writeFileSync(file, html);
console.log(`Escaped ${selected.length} Forge data expressions.`);
