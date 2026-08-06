const fs = require('fs');
const path = require('path');

function checkFile(tsFilePath) {
  const content = fs.readFileSync(tsFilePath, 'utf8');
  // Match strings starting with /Assets/ inside quotes
  const matches = [];
  const regex = /["'`](\/Assets\/[^"'`]+)["'`]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (!match[1].includes('${')) {
      matches.push(match[1]);
    }
  }
  const unique = [...new Set(matches)];

  const missing = [];
  unique.forEach(url => {
    const diskPath = path.join('./public', url);
    if (!fs.existsSync(diskPath)) {
      missing.push(url);
    }
  });

  return { file: tsFilePath, total: unique.length, missing };
}

const tsFiles = [];

function walkDir(d) {
  const entries = fs.readdirSync(d, { withFileTypes: true });
  entries.forEach(e => {
    const full = path.join(d, e.name);
    if (e.isDirectory()) walkDir(full);
    else if (e.name.endsWith('.ts')) tsFiles.push(full);
  });
}

walkDir('./personagens');

console.log(`Checking ${tsFiles.length} TS files in /personagens...\n`);

tsFiles.forEach(f => {
  const res = checkFile(f);
  if (res.missing.length > 0) {
    console.log(`❌ ${f} has ${res.missing.length} missing asset URLs:`);
    res.missing.forEach(m => console.log(`   - ${m}`));
  } else {
    console.log(`✅ ${f} (${res.total} URLs verified OK)`);
  }
});
