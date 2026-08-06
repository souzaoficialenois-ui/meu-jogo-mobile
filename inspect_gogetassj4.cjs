const fs = require('fs');
const files = fs.readdirSync('./public/Assets/personagens/gogetassj4').sort();
console.log('Files in gogetassj4:', files);
const ts = fs.readFileSync('./personagens/GogetaSSJ4.ts', 'utf8');
console.log('\nMatches for dano in GogetaSSJ4.ts:');
ts.split('\n').forEach((line, i) => {
  if (line.includes('dano')) console.log(`${i+1}: ${line}`);
});
