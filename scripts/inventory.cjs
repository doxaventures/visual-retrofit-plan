const fs = require('fs');
const path = require('path');

const roots = [
  { dir: 'data/articles', kind: 'article' },
  { dir: 'data/blog', kind: 'blog' },
  { dir: 'data/guides', kind: 'guide' },
];

const visualTypes = new Set(['stat','callout','bar-chart','illustration','comparison-table','checklist','figure','lead-infographic']);

function classify(title, slug, description) {
  const t = (title + ' ' + slug + ' ' + description).toLowerCase();
  if (t.includes('sprawl')) return 'C-SprawlDiagnostic';
  if (t.includes('integration') || t.includes('+') || (/\band\b/.test(t) && (t.includes('stack') || t.includes('sync')))) return 'D-IntegrationStack';
  if (t.includes(' vs ') || t.includes(' vs. ') || t.includes('best ') || t.includes('which') || t.includes('comparison')) return 'B-ToolComparison';
  if (t.includes('pay') || t.includes('cost') || t.includes('spend') || t.includes('price') || t.includes('what should')) return 'A-CostBreakdown';
  return 'X-CrossCutting';
}

function parseValue(src, key) {
  const re = new RegExp(`${key}:\\s*"([^"]+)"`);
  const m = src.match(re);
  return m ? m[1] : '';
}

function extractArticles(filePath, kind) {
  const src = fs.readFileSync(filePath, 'utf8');
  const exportName = src.match(/export const (\w+)/)?.[1] || 'unknown';
  const body = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const arrMatch = body.match(/export const \w+:\s*\w+\[\]\s*=\s*\[([\s\S]+?)\];\s*$/);
  if (!arrMatch) {
    console.log('No array found in', filePath.name);
    return [];
  }
  const arrSrc = arrMatch[1];

  const results = [];
  let i = 0;
  while (i < arrSrc.length) {
    if (arrSrc[i] !== '{') { i++; continue; }
    let depth = 0;
    let j = i;
    let inString = false;
    let stringChar = '';
    while (j < arrSrc.length) {
      const ch = arrSrc[j];
      if (inString) {
        if (ch === '\\') { j += 2; continue; }
        if (ch === stringChar) inString = false;
      } else if (ch === '"' || ch === "'") {
        inString = true;
        stringChar = ch;
      } else if (ch === '{') {
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0) break;
      }
      j++;
    }
    if (j >= arrSrc.length) break;
    const obj = arrSrc.slice(i, j + 1);
    i = j + 1;

    const slug = parseValue(obj, 'slug');
    const title = parseValue(obj, 'title');
    const description = parseValue(obj, 'description');
    if (!slug && !title) continue;
    const vertical = parseValue(obj, 'vertical');
    const category = parseValue(obj, 'category');

    const blocksMatch = obj.match(/blocks:\s*\[([\s\S]*?)\]\s*,?\s*(?:\w+:|\})/);
    const blocksSrc = blocksMatch ? blocksMatch[1] : '';
    const typeMatches = blocksSrc.match(/type:\s*"([^"]+)"/g) || [];
    const types = typeMatches.map(s => s.replace(/type:\s*"/, '').replace(/"$/, ''));
    const visuals = types.filter(t => visualTypes.has(t));
    const hasLead = visuals.includes('lead-infographic');
    results.push({
      kind,
      file: path.basename(filePath),
      exportName,
      slug,
      vertical,
      category,
      title,
      description,
      archetype: classify(title, slug, description),
      totalBlocks: types.length,
      visualBlocks: visuals.length,
      hasLeadInfographic: hasLead,
      blockTypes: [...new Set(types)].join(', '),
      retrofitPriority: hasLead ? (visuals.length < 3 ? 'medium' : 'low') : 'high'
    });
  }
  return results;
}

let all = [];
for (const { dir, kind } of roots) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));
  for (const f of files) {
    try {
      all = all.concat(extractArticles(path.join(dir, f), kind));
    } catch (e) {
      console.error('Error in', f, e.message);
    }
  }
}

const outDir = 'C:\\Users\\wongw\\source\\repos\\visual-retrofit-plan';
fs.mkdirSync(outDir, { recursive: true });

const out = { generated: new Date().toISOString(), total: all.length, articles: all };
fs.writeFileSync(path.join(outDir, 'backlog.json'), JSON.stringify(out, null, 2));

const headers = ['kind','file','exportName','slug','vertical','category','archetype','totalBlocks','visualBlocks','hasLeadInfographic','retrofitPriority','title'];
const csv = [headers.join(','), ...all.map(a => headers.map(h => JSON.stringify(a[h] ?? '')).join(','))].join('\n');
fs.writeFileSync(path.join(outDir, 'backlog.csv'), csv);

const byArchetype = {};
const byPriority = {};
const byFile = {};
for (const a of all) {
  byArchetype[a.archetype] = (byArchetype[a.archetype] || 0) + 1;
  byPriority[a.retrofitPriority] = (byPriority[a.retrofitPriority] || 0) + 1;
  byFile[a.file] = (byFile[a.file] || 0) + 1;
}
const summary = { generated: new Date().toISOString(), total: all.length, byArchetype, byPriority, byFile };
fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));

console.log('Total articles analyzed:', all.length);
console.log('By archetype:', byArchetype);
console.log('By priority:', byPriority);
console.log('Files with counts:', byFile);
