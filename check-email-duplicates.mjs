import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://neezlyqzgalmrmqudphl.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZXpseXF6Z2FsbXJtcXVkcGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTU1NzIsImV4cCI6MjA4OTQ5MTU3Mn0.meR84RNvuwnXOHTa67DyxY39prefQ-7qYcSvvtNn4yM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
  const email = "admin@flowstock.com";
  
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, role_id, status, is_active')
    .eq('email', email);
    
  if (error) {
    console.error("Error fetching users:", error);
  } else {
    console.log(`Found ${data?.length || 0} users with email ${email}`);
    import('fs').then(fs => fs.writeFileSync('duplicates.json', JSON.stringify(data, null, 2)));
  }
}

checkDuplicates();
