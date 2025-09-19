export const environment = {
  production: false,
  supabase: {
    url: 'https://ugecshlhptnyeemmedoy.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZWNzaGxocHRueWVlbW1lZG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDA2NTAsImV4cCI6MjA3MTQ3NjY1MH0.qQU8nSWX-6r89n_-OWHfPcYOHS1oxDcPOXXGuS0LxbY',
    // Configuración para deshabilitar confirmación de email permanentemente
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      // Deshabilitar confirmación de email
      confirmEmail: false
    }
  }
};