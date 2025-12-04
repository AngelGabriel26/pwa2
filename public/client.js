// client.js - register sw + subscribe to push + UI handlers
(async function(){
  'use strict';
  
  // register service worker
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registrado', reg);
    } catch (err) {
      console.error('Error registrando SW:', err);
    }
  }

  // helper: urlBase64ToUint8Array for VAPID key
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function getVapidPublicKey(){
    try {
      const resp = await fetch('/vapidPublicKey');
      const data = await resp.json();
      return data.publicKey;
    } catch (err) {
      console.error('No se pudo obtener la clave VAPID', err);
      return null;
    }
  }

  async function subscribeToPush(){
    if (!('serviceWorker' in navigator)) return console.error('Service Worker no soportado');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return console.error('Permiso de notificación denegado');
    
    const reg = await navigator.serviceWorker.ready;
    const publicKey = await getVapidPublicKey();
    if (!publicKey) return console.error('Clave VAPID no disponible');

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    // Enviar suscripción al servidor
    await fetch('/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Suscrito a notificaciones push', subscription);
    return subscription;
  }

  // UI Event Handler para Suscripción
  const btnNotify = document.getElementById('btnNotify');
  if(btnNotify) btnNotify.addEventListener('click', subscribeToPush);

  // UI Event Handler para Notificación de Prueba
  const btnNotifyTest = document.getElementById('btnNotifyTest');
  if(btnNotifyTest) btnNotifyTest.addEventListener('click', async ()=>{
    // Esta función envía una notificación PUSH (requiere servidor)
    // El mensaje ha sido modificado para Potencia y Raíz Cuadrada
    const body = {
      title: '¡Hora de repasar la aritmética!',
      message: 'Practica 5 minutos de potencias y raíces. ¡A dominar el tema! 🚀', // MODIFICADO
      url: '/actividades.html'
    };
    const resp = await fetch('/sendNotification', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await resp.json();
    alert('Notificación enviada (intento). Revisar consola del servidor.');
    console.log('sendNotification result', data);
  });
  
  // El código de renderizado de "mini-board" se elimina o ignora ya que ya no se usa.
  // Es mejor eliminarlo si se encuentra en el archivo para limpiar el código, 
  // pero ya que no tengo acceso al archivo original, lo dejo como nota.

})();
