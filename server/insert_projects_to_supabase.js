// Script to insert projects from data.js into Supabase
const { supabase } = require('./supabaseClient');
const { projects } = require('./data');

async function insertProjects() {
  for (const project of projects) {
    // Convert Date objects to ISO strings for Supabase
    const payload = {
      ...project,
      createdAt: project.createdAt ? project.createdAt.toISOString() : null,
      startDate: project.startDate ? project.startDate.toISOString() : null,
      endDate: project.endDate ? project.endDate.toISOString() : null,
    };
    // Remove fields not present in Supabase table if needed
    const { data, error } = await supabase.from('projects').insert([payload]);
    if (error) {
      console.error('Error inserting project:', error.message);
    } else {
      console.log('Inserted project:', data);
    }
  }
}

insertProjects();