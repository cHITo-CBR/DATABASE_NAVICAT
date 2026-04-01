const fs = require('fs');
const path = require('path');

const actionsDir = path.join(__dirname, 'app/actions');
const files = fs.readdirSync(actionsDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  let content = fs.readFileSync(path.join(actionsDir, file), 'utf8');
  
  // Remove any existing "use server" declarations to prevent duplicates
  content = content.replace(/^"use server";?\s*/gm, '');
  content = content.replace(/^'use server';?\s*/gm, '');
  
  // Prepend it cleanly at the very top
  content = '"use server";\n' + content.trimStart();
  
  fs.writeFileSync(path.join(actionsDir, file), content);
  console.log(`Fixed ${file}`);
});
