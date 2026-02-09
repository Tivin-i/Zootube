#!/usr/bin/env node
/**
 * List users (parents) in the database.
 * Run from project root: node --env-file=.env scripts/list-users.js
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Use: node --env-file=.env scripts/list-users.js');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey);

async function main() {
  const { data: parents, error } = await supabase
    .from('parents')
    .select('id, email, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching users:', error.message);
    process.exit(1);
  }

  if (!parents || parents.length === 0) {
    console.log('No users (parents) in the database.');
    return;
  }

  console.log('Users in database (parents table):\n');
  parents.forEach((p, i) => {
    console.log(`${i + 1}. ${p.email}`);
    console.log(`   id: ${p.id}`);
    console.log(`   created_at: ${p.created_at}`);
    console.log('');
  });
  console.log(`Total: ${parents.length} user(s)`);
}

main();
