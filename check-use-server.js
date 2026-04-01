const fs = require('fs');
const path = require('path');

const actionsDir = path.join(__dirname, 'app/actions');
const files = fs.readdirSync(actionsDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const content = fs.readFileSync(path.join(actionsDir, file), 'utf8');
  if (!content.trim().startsWith('"use server"') && !content.trim().startsWith("'use server'")) {
    console.log(`Missing "use server" at top of ${file}`);
  }
});
console.log("Check complete.");
