/* ==================================================
   Server.js - Servidor Node.js
   Backend para PWA con Web Push Notifications
   ================================================== */

const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARES =====
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== ALMACENAMIENTO DE SUSCRIPCIONES =====
// En producción, usar una base de datos real (MongoDB, PostgreSQL, etc.)
const SUBSCRIPTIONS_FILE = path.join(__dirname, 'subscriptions.json');
let subscriptions = [];

// Cargar suscripciones desde archivo
if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
  try {
    const data = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf8');
    subscriptions = JSON.parse(data);
    console.log(`📋 Cargadas ${subscriptions.length} suscripciones`);
  } catch (err) {
    console.error('Error al cargar suscripciones:', err);
  }
}

// Guardar suscripciones en archivo
function saveSubscriptions() {
  try {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));
    console.log(`💾 Guardadas ${subscriptions.length} suscripciones`);
  } catch (err) {
    console.error('Error al guardar suscripciones:', err);
  }
}

// ===== CONFIGURACIÓN DE WEB PUSH =====
// Generar llaves VAPID: npx web-push generate-vapid-keys
let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || null,
  privateKey: process.env.VAPID_PRIVATE_KEY || null
};

if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  console.log('⚠️  No se encontraron llaves VAPID en variables de entorno');
  console.log('🔑 Generando llaves temporales para desarrollo...');
  vapidKeys = webpush.generateVAPIDKeys();
  console.log('\n📌 GUARDA ESTAS LLAVES EN TU ARCHIVO .env:');
  console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
  console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
  console.log('');
}

webpush.setVapidDetails(
  'mailto:tu-email@ejemplo.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// ===== ENDPOINTS API =====

// Obtener llave pública VAPID
app.get('/vapidPublicKey', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// Suscribirse a notificaciones push
app.post('/subscribe', (req, res) => {
  const subscription = req.body;
  
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ 
      error: 'Suscripción inválida',
      success: false 
    });
  }

  // Evitar duplicados
  const exists = subscriptions.find(sub => sub.endpoint === subscription.endpoint);
  if (!exists) {
    subscriptions.push(subscription);
    saveSubscriptions();
    console.log('✅ Nueva suscripción registrada');
    console.log(`📊 Total de suscripciones: ${subscriptions.length}`);
  } else {
    console.log('ℹ️  Suscripción ya existe');
  }

  res.status(201).json({ 
    success: true,
    message: 'Suscripción registrada correctamente',
    totalSubscriptions: subscriptions.length
  });
});

// Cancelar suscripción
app.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  
  if (!endpoint) {
    return res.status(400).json({ 
      error: 'Endpoint requerido',
      success: false 
    });
  }

  const initialLength = subscriptions.length;
  subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
  
  if (subscriptions.length < initialLength) {
    saveSubscriptions();
    console.log('🗑️  Suscripción eliminada');
    res.json({ 
      success: true,
      message: 'Suscripción cancelada',
      totalSubscriptions: subscriptions.length
    });
  } else {
    res.status(404).json({ 
      success: false,
      message: 'Suscripción no encontrada'
    });
  }
});

// Enviar notificación a todos los suscriptores
app.post('/sendNotification', async (req, res) => {
  const { 
    title = 'Coordenadas Cartesianas', 
    message = '¡Practica tus coordenadas!', 
    url = '/',
    data = {}
  } = req.body;

  if (subscriptions.length === 0) {
    return res.json({ 
      success: false,
      message: 'No hay suscriptores',
      sent: 0
    });
  }

  const payload = JSON.stringify({
    title,
    message,
    url,
    data,
    timestamp: Date.now()
  });

  const results = [];
  let successCount = 0;
  let failureCount = 0;

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(subscription, payload);
      results.push({ 
        endpoint: subscription.endpoint.substring(0, 50) + '...', 
        status: 'success' 
      });
      successCount++;
    } catch (err) {
      console.error('❌ Error enviando notificación:', err.message);
      results.push({ 
        endpoint: subscription.endpoint.substring(0, 50) + '...', 
        status: 'error', 
        error: err.message 
      });
      failureCount++;
      
      // Si el error es 410 (Gone), eliminar la suscripción
      if (err.statusCode === 410) {
        subscriptions = subscriptions.filter(sub => sub.endpoint !== subscription.endpoint);
        saveSubscriptions();
        console.log('🗑️  Suscripción inválida eliminada');
      }
    }
  }

  console.log(`📤 Notificaciones enviadas: ${successCount} exitosas, ${failureCount} fallidas`);

  res.json({ 
    success: true,
    sent: successCount,
    failed: failureCount,
    totalSubscriptions: subscriptions.length,
    results
  });
});

// Enviar notificación programada (recordatorio)
app.post('/scheduleReminder', async (req, res) => {
  const { delayMinutes = 5 } = req.body;
  
  const delayMs = delayMinutes * 60 * 1000;
  
  setTimeout(async () => {
    console.log('⏰ Enviando recordatorio programado...');
    
    const payload = JSON.stringify({
      title: '📐 Recordatorio de Estudio',
      message: 'Es hora de practicar coordenadas cartesianas. ¡5 minutos de práctica!',
      url: '/actividades.html',
      timestamp: Date.now()
    });

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(subscription, payload);
      } catch (err) {
        console.error('Error en recordatorio:', err.message);
      }
    }
  }, delayMs);

  res.json({ 
    success: true,
    message: `Recordatorio programado para dentro de ${delayMinutes} minutos`,
    willSendAt: new Date(Date.now() + delayMs).toISOString()
  });
});

// Estadísticas
app.get('/stats', (req, res) => {
  res.json({
    totalSubscriptions: subscriptions.length,
    vapidPublicKey: vapidKeys.publicKey.substring(0, 20) + '...',
    serverUptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Estado del servidor
app.get('/status', (req, res) => {
  res.json({ 
    ok: true, 
    subscriptions: subscriptions.length,
    message: 'Servidor funcionando correctamente'
  });
});

// ===== SERVIR ARCHIVOS ESTÁTICOS =====
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== MANEJO DE ERRORES =====
app.use((err, req, res, next) => {
  console.error('❌ Error del servidor:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message 
  });
});

// 404 para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.path 
  });
});

// ===== INICIAR SERVIDOR =====
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 Servidor iniciado correctamente');
  console.log('='.repeat(50));
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📊 Suscripciones activas: ${subscriptions.length}`);
  console.log(`🔑 VAPID configurado: ${vapidKeys.publicKey ? 'Sí' : 'No'}`);
  console.log('='.repeat(50) + '\n');
});

// ===== MANEJO DE CIERRE GRACEFUL =====
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recibido, cerrando servidor...');
  saveSubscriptions();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT recibido, cerrando servidor...');
  saveSubscriptions();
  process.exit(0);
});

module.exports = app;