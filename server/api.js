const { supabase } = require('./supabaseClient');

async function getProjectsFromSupabase() {
  const { data, error } = await supabase
    .from('projects')
    .select('*');
  if (error) throw error;
  return data;
}

module.exports = { getProjectsFromSupabase };