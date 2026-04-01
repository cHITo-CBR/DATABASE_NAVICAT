import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://neezlyqzgalmrmqudphl.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZXpseXF6Z2FsbXJtcXVkcGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTU1NzIsImV4cCI6MjA4OTQ5MTU3Mn0.meR84RNvuwnXOHTa67DyxY39prefQ-7qYcSvvtNn4yM';

const supabase = createClient(supabaseUrl, supabaseKey);

import * as fs from 'fs';

async function checkAdmin() {
  const { data: adminRole } = await supabase.from('roles').select('id, name').eq('name', 'admin').single();
  if (!adminRole) {
    console.log("No admin role found.");
    return;
  }
  
  const { data: users, error } = await supabase.from('users').select('full_name, email, status, is_active').eq('role_id', adminRole.id);
  if (error) {
    console.error("Error fetching users:", error);
    return;
  }
  
  fs.writeFileSync('admin.json', JSON.stringify(users, null, 2));
  console.log("Admin Users saved to admin.json");
}
checkAdmin();
