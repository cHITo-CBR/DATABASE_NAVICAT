import { createClient } from '@supabase/supabase-js';
import bcrypt from "bcryptjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://neezlyqzgalmrmqudphl.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZXpseXF6Z2FsbXJtcXVkcGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTU1NzIsImV4cCI6MjA4OTQ5MTU3Mn0.meR84RNvuwnXOHTa67DyxY39prefQ-7qYcSvvtNn4yM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetPassword() {
  const newPassword = "password123";
  const email = "admin@flowstock.com";
  
  console.log(`Hashing new password: ${newPassword}...`);
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  console.log(`Updating database for ${email}...`);
  const { data, error } = await supabase
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('email', email);
    
  if (error) {
    console.error("Error updating password:", error);
  } else {
    console.log(`Successfully reset password for ${email} to ${newPassword}`);
  }
}

resetPassword();
