const { Project, SyntaxKind } = require('ts-morph');
const path = require('path');
const fs = require('fs');

async function main() {
  const project = new Project();
  const actionsDir = path.join(__dirname, 'app/actions');
  const files = fs.readdirSync(actionsDir)
    .filter(f => f.endsWith('.ts') && f !== 'auth.ts')
    .map(f => path.join(actionsDir, f));

  project.addSourceFilesAtPaths(files);

  for (const sourceFile of project.getSourceFiles()) {
    let hasChanges = false;
    
    // Check if the file imports { supabase } from "@/lib/supabase";
    const oldImport = sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue() === "@/lib/supabase");
    
    if (oldImport) {
      oldImport.remove();
      sourceFile.addImportDeclaration({
        namedImports: ['createClient'],
        moduleSpecifier: '@/lib/supabase/server'
      });
      hasChanges = true;
    }

    // Process all exported async functions
    for (const func of sourceFile.getFunctions()) {
      if (func.isExported() && func.isAsync()) {
        const statements = func.getStatements();
        const bodyText = func.getBodyText() || '';
        
        if (!bodyText.includes('const supabase = await createClient()')) {
          func.insertStatements(0, 'const supabase = await createClient();');
          hasChanges = true;
        }
      }
    }

    // Process all exported async arrow functions in variable declarations
    for (const varDecl of sourceFile.getVariableDeclarations()) {
      if (varDecl.hasExportKeyword && varDecl.hasExportKeyword()) { // if exported
        const init = varDecl.getInitializer();
        if (init && (init.getKind() === SyntaxKind.ArrowFunction || init.getKind() === SyntaxKind.FunctionExpression)) {
          if (init.isAsync()) {
            const bodyText = init.getBodyText() || '';
            if (!bodyText.includes('const supabase = await createClient()')) {
              // Usually arrow function body: { ... }
              init.insertStatements(0, 'const supabase = await createClient();');
              hasChanges = true;
            }
          }
        }
      }
    }

    if (hasChanges) {
      sourceFile.saveSync();
      console.log(`Updated ${path.basename(sourceFile.getFilePath())}`);
    }
  }
}

main().catch(console.error);
