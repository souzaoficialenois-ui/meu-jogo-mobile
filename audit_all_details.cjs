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

  const tsContent = fs.readFileSync(tsPath, 'utf8');
  const filesOnDisk = fs.readdirSync(dirPath).filter(f => f.endsWith('.gif') || f.endsWith('.png') || f.endsWith('.webp'));

  // Extract all filename references (e.g. 'something.gif')
  const allRefFiles = [...tsContent.matchAll(/[\w\-\s\(\)\.]+\.(gif|png|webp)/g)].map(m => m[0]);
  const uniqueRefFiles = [...new Set(allRefFiles)];

  const missingOnDisk = [];
  uniqueRefFiles.forEach(f => {
    // ignore assets outside this character if any, but check if file exists in character dir
    if (!filesOnDisk.includes(f) && !f.includes('placeholder') && !f.includes('bg_') && !f.includes('avatar_')) {
      missingOnDisk.push(f);
    }
  });

  const unreferencedOnDisk = [];
  filesOnDisk.forEach(f => {
    if (!tsContent.includes(f)) {
      unreferencedOnDisk.push(f);
    }
  });

  console.log(`\n========================================`);
  console.log(`CHARACTER: ${ts} (${dir})`);
  console.log(`Files on Disk: ${filesOnDisk.length}`);
  console.log(`========================================`);

  if (missingOnDisk.length > 0) {
    console.log(`❌ REFERENCED IN TS BUT MISSING ON DISK (${missingOnDisk.length}):`);
    missingOnDisk.forEach(m => console.log(`   - ${m}`));
  } else {
    console.log(`✅ No broken file references in TS.`);
  }

  if (unreferencedOnDisk.length > 0) {
    console.log(`⚠️ ON DISK BUT NOT IN TS (${unreferencedOnDisk.length}):`);
    unreferencedOnDisk.forEach(f => console.log(`   - ${f}`));
  } else {
    console.log(`✅ All files on disk are referenced in TS.`);
  }
});
