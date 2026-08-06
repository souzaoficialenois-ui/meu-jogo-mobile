const fs = require('fs');
const path = require('path');

const charDirs = fs.readdirSync('./public/Assets/personagens');

charDirs.forEach(dir => {
  const dirPath = path.join('./public/Assets/personagens', dir);
  if (!fs.statSync(dirPath).isDirectory()) return;
  const filesOnDisk = fs.readdirSync(dirPath).sort();
  console.log(`========================================`);
  console.log(`CHARACTER DIR: ${dir} (${filesOnDisk.length} files)`);
  console.log(`========================================`);

  // Print all files on disk grouped by base animation name
  const groups = {};
  filesOnDisk.forEach(f => {
    const base = f.replace(/(_\d+)+(\.gif|\.png)$/, '').replace(/(\.gif|\.png)$/, '');
    if (!groups[base]) groups[base] = [];
    groups[base].push(f);
  });

  Object.keys(groups).sort().forEach(base => {
    console.log(`  [Group ${base}]:`, groups[base].join(', '));
  });
});
