const SUPABASE_URL = 'https://vngxmxuyurriodkzitpb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuZ3hteHV5dXJyaW9ka3ppdHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4OTgzNDIsImV4cCI6MjA5NzQ3NDM0Mn0.W6f5o44vdsOm_HW7Obp2n3QBRJAsCckh2VFhpXHNW5I';
let supabaseClient = null;
try { supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); console.log('Supabase connected'); } catch(e){ console.warn('Supabase unavailable', e); }
