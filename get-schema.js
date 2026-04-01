const supabaseUrl = 'https://neezlyqzgalmrmqudphl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZXpseXF6Z2FsbXJtcXVkcGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTU1NzIsImV4cCI6MjA4OTQ5MTU3Mn0.meR84RNvuwnXOHTa67DyxY39prefQ-7qYcSvvtNn4yM';

async function fetchSchema() {
  const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`);
  const data = await res.json();
  const defs = data.definitions;
  
  let output = "";
  for (const [tableName, tableDef] of Object.entries(defs)) {
    output += `Table: ${tableName}\n`;
    const props = tableDef.properties || {};
    for (const [colName, colDef] of Object.entries(props)) {
      output += `  - ${colName} (${colDef.type || colDef.format})\n`;
    }
    output += "\n";
  }
  console.log(output);
}
fetchSchema().catch(console.error);
