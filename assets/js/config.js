/* Conexión con Supabase (proyecto propio de Hilos del Alma).
   Se llenan en Supabase → Project Settings → API. La llave pública es segura de exponer:
   las políticas de supabase-setup.sql solo dejan leer lo visible; escribir exige ser admin.
   Si quedan vacías, el sitio usa las piezas de respaldo de data.js y el panel avisa. */
const SUPABASE_URL = "https://omferhcjrrncxblevbyj.supabase.co";
const SUPABASE_KEY = "sb_publishable_z-Xx8_hxSgKJqItNbePW1A_eKE1hABZ";
