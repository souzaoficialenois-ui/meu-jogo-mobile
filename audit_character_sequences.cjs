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

  const tsContent = fs.readFileSync(tsPath, 'utf8');
  const filesOnDisk = fs.readdirSync(dirPath).filter(f => f.endsWith('.gif') || f.endsWith('.png') || f.endsWith('.webp')).sort();

  console.log(`\n========================================`);
  console.log(`CHARACTER: ${ts} (${dir}) - ${filesOnDisk.length} files on disk`);
  console.log(`========================================`);

  // Find all file names referenced in TS
  const referencedInTS = [];
  const missingFromDisk = [];

  // Find strings ending in .gif, .png, .webp in TS
  const matches = tsContent.match(/[\w\-\(\)\.]+\.(gif|png|webp)/g) || [];
  const uniqueMatches = [...new Set(matches)];

  uniqueMatches.forEach(f => {
    if (f.includes('placeholder') || f.includes('bg_') || f.includes('avatar_')) return;
    if (filesOnDisk.includes(f)) {
      referencedInTS.push(f);
    } else {
      missingFromDisk.push(f);
    }
  });

  const unreferencedOnDisk = filesOnDisk.filter(f => !referencedInTS.includes(f));

  if (missingFromDisk.length > 0) {
    console.log(`❌ References in TS that DO NOT exist on disk (${missingFromDisk.length}):`);
    missingFromDisk.forEach(m => console.log(`   - ${m}`));
  } else {
    console.log(`✅ Zero missing files in TS references.`);
  }

  if (unreferencedOnDisk.length > 0) {
    console.log(`⚠️ Files on disk NOT referenced in TS (${unreferencedOnDisk.length}):`);
    unreferencedOnDisk.forEach(u => console.log(`   - ${u}`));
  } else {
    console.log(`✅ All files on disk are referenced in TS.`);
  }
});
