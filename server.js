/* ==================================================
   Server.js - Servidor Node.js
   Backend para PWA de Potencia y Raíz (Web Push Notifications)
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

// ===== CONFIGURACIÓN VAPID =====
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:angel.admin@ejemplo.com';

let vapidKeys = { publicKey: VAPID_PUBLIC_KEY, privateKey: VAPID_PRIVATE_KEY };

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn('⚠️ ADVERTENCIA: Las claves VAPID no están definidas en .env. Se generarán unas temporales.');
  console.warn('Ejecuta npm run generate-vapid o define VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY en .env');
  vapidKeys = webpush.generateVAPIDKeys();
}

webpush.setVapidDetails(
  VAPID_SUBJECT,
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Función para enviar la notificación
async function sendNotification(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, payload);
    return { status: 'success' };
  } catch (error) {
    // Si el error es 410 Gone, la suscripción ya no es válida y debe ser eliminada
    if (error.statusCode === 410) {
      console.log('🚨 Suscripción expirada. Eliminando...');
      subscriptions = subscriptions.filter(s => s.endpoint !== subscription.endpoint);
      saveSubscriptions();
      return { status: 'deleted' };
    }
    console.error('❌ Error al enviar notificación:', error.message);
    return { status: 'error', message: error.message };
  }
}

// ===== ENDPOINTS DE LA API =====

// Obtener la clave pública VAPID
app.get('/vapidPublicKey', (req, res) => {
  res.send(vapidKeys.publicKey);
});

// Registrar una nueva suscripción
app.post('/subscribe', (req, res) => {
  const subscription = req.body;

  // Verificar si la suscripción ya existe
  const existingSubscription = subscriptions.find(s => s.endpoint === subscription.endpoint);
  if (!existingSubscription) {
    subscriptions.push(subscription);
    saveSubscriptions();
    console.log('✅ Nueva suscripción registrada');
    res.status(201).json({ message: 'Suscripción registrada con éxito' });
  } else {
    res.status(200).json({ message: 'Suscripción ya existe' });
  }
});

// Eliminar una suscripción
app.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  const initialLength = subscriptions.length;

  subscriptions = subscriptions.filter(s => s.endpoint !== endpoint);
  
  if (subscriptions.length < initialLength) {
    saveSubscriptions();
    console.log('🗑️ Suscripción eliminada');
    res.status(200).json({ message: 'Suscripción eliminada con éxito' });
  } else {
    res.status(404).json({ message: 'Suscripción no encontrada' });
  }
});


// Endpoint para enviar una notificación a todos
app.post('/sendNotification', async (req, res) => {
  // Parámetros opcionales del cuerpo de la solicitud (body)
  const { title, message, url, data } = req.body;

  // Payload de la notificación (ADAPTADO AL NUEVO TEMA)
  const notificationPayload = JSON.stringify({
    title: title || '🧠 Reto Matemático: Potencia y Raíz', // Título adaptado
    options: {
      body: message || '¡A practicar! ¿Cuál es la raíz cuadrada de 64 o 2 elevado a la potencia de 3?', // Mensaje adaptado
      icon: '/img/icons/icon-192x192.png',
      badge: '/img/icons/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        url: url || '/quiz/potencia-raiz', // URL de destino adaptada
        dateOfArrival: Date.now(),
        primaryKey: 1,
        topic: data?.topic || 'matematicas-potencia-raiz' // Tema adaptado
      }
    }
  });

  const sendPromises = subscriptions.map(sub => sendNotification(sub, notificationPayload));
  const results = await Promise.all(sendPromises);

  // Lógica final de respuesta
  res.status(202).json({ 
    message: 'Procesando envío de notificaciones', 
    totalSubscriptions: subscriptions.length,
    processed: results.filter(r => r.status === 'success').length,
    deleted: results.filter(r => r.status === 'deleted').length,
    errors: results.filter(r => r.status === 'error').length
  });
});

// Información del servidor
app.get('/info', (req, res) => {
  res.json({
    name: 'Potencia y Raíz PWA Server',
    version: '1.0.0',
    uptime: process.uptime(),
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

// ===== SERVIR ARCHIVOS ESTÁTICOS (asumiendo que 'public' contiene los archivos de la PWA) =====
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
  console.log('🚀 Servidor de PWA de Potencia y Raíz iniciado correctamente'); // Mensaje adaptado
  console.log('='.repeat(50));
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📊 Suscripciones activas: ${subscriptions.length}`);
  console.log(`🔑 VAPID configurado: ${vapidKeys.publicKey ? 'Sí' : 'No'}`);
  console.log('='.repeat(50));
});

