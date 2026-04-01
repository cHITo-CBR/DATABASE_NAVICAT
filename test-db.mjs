import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://neezlyqzgalmrmqudphl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZXpseXF6Z2FsbXJtcXVkcGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTU1NzIsImV4cCI6MjA4OTQ5MTU3Mn0.meR84RNvuwnXOHTa67DyxY39prefQ-7qYcSvvtNn4yM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing connection...");
  const { data: roles, error: rolesError } = await supabase.from('roles').select('*');
  console.log("Roles:", roles, "Error:", rolesError?.message);

  const { data: users, error: usersError } = await supabase.from('users').select('id, full_name, email, status, is_active, role_id').limit(5);
  console.log("Users:", users, "Error:", usersError?.message);
}

test();
