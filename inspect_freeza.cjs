const fs = require('fs');
const files = fs.readdirSync('./public/Assets/personagens/freeza').sort();
console.log('Files in freeza:', files);
const ts = fs.readFileSync('./personagens/Frieza.ts', 'utf8');
console.log('\nMatches for dano in Frieza.ts:');
ts.split('\n').forEach((line, i) => {
  if (line.includes('dano')) console.log(`${i+1}: ${line}`);
});
