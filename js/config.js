// api/config.js - Передаёт конфигурацию клиенту
// Ключи берутся из Environment Variables Vercel

export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'public, max-age=300'); // Кэш 5 минут
  
  // Отдаём только публичные ключи (anon key безопасен для клиента)
  res.status(200).json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_ANON_KEY || ''
  });
}
