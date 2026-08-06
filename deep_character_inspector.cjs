const fs = require('fs');
const path = require('path');

const charMap = [
  { ts: 'BrolyIkari.ts', dir: 'brolyikari' },
  { ts: 'Frieza.ts', dir: 'freeza' },
  { ts: 'GogetaSSJ4.ts', dir: 'gogetassj4' },
  { ts: 'GokuBase.ts', dir: 'gokubase' },
  { ts: 'GokuBlue.ts', dir: 'gokublue' },
  { ts: 'GokuMUI.ts', dir: 'gokumui' },
  { ts: 'GokuSSJ.ts', dir: 'gokussj' },
  { ts: 'Kuririn.ts', dir: 'kuririn' },
  { ts: 'TeenGohanSSJ2.ts', dir: 'teengohanssj2' },
  { ts: 'TrunksSSJ2.ts', dir: 'trunksssj2' },
  { ts: 'VegetaSSJMajin.ts', dir: 'vegetassjmajin' },
];

charMap.forEach(({ ts, dir }) => {
  const tsPath = path.join('./personagens', ts);
  const dirPath = path.join('./public/Assets/personagens', dir);
  
  if (!fs.existsSync(tsPath) || !fs.existsSync(dirPath)) return;

  const filesOnDisk = fs.readdirSync(dirPath).filter(f => f.endsWith('.gif') || f.endsWith('.png') || f.endsWith('.webp')).sort();
  const tsContent = fs.readFileSync(tsPath, 'utf8');

  console.log(`\n========================================`);
  console.log(`INSPECTING: ${ts} (${dir})`);
  console.log(`Total files on disk: ${filesOnDisk.length}`);
  console.log(`========================================`);

  // Find all file references in tsContent
  const fileRefsInTS = [];
  filesOnDisk.forEach(f => {
    if (tsContent.includes(f)) {
      fileRefsInTS.push(f);
    }
  });

  const unreferenced = filesOnDisk.filter(f => !fileRefsInTS.includes(f));
  if (unreferenced.length > 0) {
    console.log(`⚠️ Unreferenced files on disk:`, unreferenced);
  }

  // Check for any hardcoded files in tsContent that don't exist
  const matches = tsContent.match(/["'`]([^"'`\n]+\.(gif|png|webp))["'`]/g) || [];
  const broken = [];
  matches.forEach(m => {
    const filename = m.replace(/["'`]/g, '');
    const basename = path.basename(filename);
    if (!basename.includes('placeholder') && !basename.includes('bg_') && !basename.includes('avatar_')) {
      if (!filesOnDisk.includes(basename)) {
        broken.push(basename);
      }
    }
  });

  if (broken.length > 0) {
    console.log(`❌ Broken references in ${ts}:`, [...new Set(broken)]);
  }
});
