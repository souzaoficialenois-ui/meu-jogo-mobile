const fs = require('fs');
const path = require('path');

const charDirs = fs.readdirSync('./public/Assets/personagens');

charDirs.forEach(dir => {
  const dirPath = path.join('./public/Assets/personagens', dir);
  if (!fs.statSync(dirPath).isDirectory()) return;
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.gif') || f.endsWith('.png') || f.endsWith('.webp')).sort();

  console.log(`\n========================================`);
  console.log(`CHAR DIR: ${dir} (${files.length} files)`);
  console.log(`========================================`);
  files.forEach(f => console.log(` - ${f}`));
});
