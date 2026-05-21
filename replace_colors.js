const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  { regex: /rgba\(\s*0\s*,\s*212\s*,\s*255/g, replacement: 'rgba(0,217,126' }, // cyan -> emerald
  { regex: /rgba\(\s*2\s*,\s*132\s*,\s*199/g, replacement: 'rgba(0,106,78' }, // light mode blue -> bangladesh green
  { regex: /#00d4ff/gi, replacement: '#00D97E' }, // cyan hex -> emerald
  { regex: /#0ea5e9/gi, replacement: '#006A4E' },
  { regex: /#0891b2/gi, replacement: '#3CCB95' },
  { regex: /#0284c7/gi, replacement: '#006A4E' }
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const { regex, replacement } of replacements) {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDir(srcDir);
console.log('Color replacement complete.');
