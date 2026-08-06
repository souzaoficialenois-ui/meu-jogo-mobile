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
  
  if (!fs.existsSync(tsPath)) {
    console.log(`ERROR: ${tsPath} does not exist`);
    return;
  }
  if (!fs.existsSync(dirPath)) {
    console.log(`ERROR: ${dirPath} does not exist`);
    return;
  }

  const tsContent = fs.readFileSync(tsPath, 'utf8');
  const filesOnDisk = fs.readdirSync(dirPath).filter(f => f.endsWith('.gif') || f.endsWith('.png') || f.endsWith('.webp'));

  console.log(`\n========================================`);
  console.log(`AUDITING ${ts} <---> /public/Assets/personagens/${dir}`);
  console.log(`========================================`);

  // Extract all strings starting with /Assets/personagens/
  const regex = new RegExp(`/Assets/personagens/${dir}/[^"'\`\\s,]+`, 'g');
  const referencedPaths = tsContent.match(regex) || [];
  const uniqueRefPaths = [...new Set(referencedPaths)];

  // Check referenced files that do NOT exist on disk
  const missingOnDisk = [];
  uniqueRefPaths.forEach(ref => {
    const fullPath = path.join('./public', ref);
    if (!fs.existsSync(fullPath)) {
      missingOnDisk.push(ref);
    }
  });

  if (missingOnDisk.length > 0) {
    console.log(`❌ REFERENCED IN ${ts} BUT MISSING ON DISK:`);
    missingOnDisk.forEach(m => console.log(`   - ${m}`));
  } else {
    console.log(`✅ All ${uniqueRefPaths.length} referenced URLs exist on disk.`);
  }

  // Check files on disk that are NOT referenced in TS
  const unreferencedOnDisk = [];
  filesOnDisk.forEach(f => {
    const expectedRef = `/Assets/personagens/${dir}/${f}`;
    if (!uniqueRefPaths.includes(expectedRef) && !tsContent.includes(f)) {
      unreferencedOnDisk.push(f);
    }
  });

  if (unreferencedOnDisk.length > 0) {
    console.log(`⚠️ ON DISK BUT NOT REFERENCED IN ${ts}:`);
    unreferencedOnDisk.forEach(f => console.log(`   - ${f}`));
  } else {
    console.log(`✅ All ${filesOnDisk.length} files on disk are referenced in ${ts}.`);
  }
});
