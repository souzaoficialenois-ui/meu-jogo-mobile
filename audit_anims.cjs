const fs = require('fs');
const path = require('path');

const charDirs = fs.readdirSync('./public/Assets/personagens');
console.log('Character directories on disk:', charDirs);

const tsFiles = fs.readdirSync('./personagens').filter(f => f.endsWith('.ts'));
console.log('TS character files:', tsFiles);

charDirs.forEach(dir => {
  const dirPath = path.join('./public/Assets/personagens', dir);
  if (!fs.statSync(dirPath).isDirectory()) return;
  const filesOnDisk = fs.readdirSync(dirPath).filter(f => f.endsWith('.gif') || f.endsWith('.png'));
  console.log(`\n=== Directory: ${dir} (${filesOnDisk.length} files) ===`);
  
  // Find matching TS file
  const tsFile = tsFiles.find(f => {
    const nameNoExt = f.replace('.ts', '').toLowerCase();
    const dirClean = dir.toLowerCase();
    if (nameNoExt === dirClean) return true;
    if (dirClean === 'freeza' && nameNoExt === 'frieza') return true;
    return nameNoExt.includes(dirClean) || dirClean.includes(nameNoExt);
  });

  if (!tsFile) {
    console.log(`  No exact TS file match found for ${dir}`);
  } else {
    console.log(`  Matching TS file: ${tsFile}`);
    const tsContent = fs.readFileSync(path.join('./personagens', tsFile), 'utf8');
    
    // Also check beam files if applicable
    let extraContent = '';
    const beamDir = './personagens/beams';
    if (fs.existsSync(beamDir)) {
      const beamFiles = fs.readdirSync(beamDir);
      beamFiles.forEach(bf => {
        if (bf.toLowerCase().includes(dir.toLowerCase()) || bf.toLowerCase().includes(tsFile.replace('.ts','').toLowerCase())) {
          extraContent += '\n' + fs.readFileSync(path.join(beamDir, bf), 'utf8');
        }
      });
    }

    const fullTSContent = tsContent + extraContent;

    // Check missing files on disk vs tsContent
    const missingInTS = [];
    filesOnDisk.forEach(f => {
      if (!fullTSContent.includes(f)) {
        missingInTS.push(f);
      }
    });

    if (missingInTS.length > 0) {
      console.log(`  [!] Files ON DISK but NOT referenced in TS (${missingInTS.length}):`, missingInTS);
    } else {
      console.log(`  All ${filesOnDisk.length} files on disk are referenced!`);
    }

    // Check referenced files in TS that are NOT on disk
    const matches = fullTSContent.match(/\/Assets\/personagens\/[^\s"'`\,]+/g) || [];
    const missingOnDisk = [];
    matches.forEach(m => {
      const fullPath = path.join('.', 'public', m);
      if (!fs.existsSync(fullPath)) {
        missingOnDisk.push(m);
      }
    });
    if (missingOnDisk.length > 0) {
      console.log(`  [!] Files REFERENCED in TS but MISSING ON DISK (${missingOnDisk.length}):`, [...new Set(missingOnDisk)]);
    }
  }
});
