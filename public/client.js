// client.js - register sw + subscribe to push + UI handlers
(async function(){
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
    if (!('serviceWorker' in navigator)) return alert('Service Worker no soportado');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return alert('Permiso de notificaciones denegado');

    const publicKey = await getVapidPublicKey();
    if (!publicKey) return alert('No se obtuvo clave pública VAPID (servidor).');

    const reg = await navigator.serviceWorker.ready;
    try {
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      // send to server
      await fetch('/subscribe', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(sub)
      });
      alert('🔔 Notificaciones activadas. ¡Listo!');
    } catch (err) {
      console.error('Suscripción falló', err);
      alert('No se pudo activar notificaciones: ' + err.message);
    }
  }

  // UI buttons
  document.getElementById('goPractica').addEventListener('click', ()=>location.href='juego.html');
  document.getElementById('goExamen').addEventListener('click', ()=>location.href='examen.html');
  document.getElementById('btnSubscribe').addEventListener('click', subscribeToPush);

  // Test notification button: calls server /sendNotification
  document.getElementById('btnTestNotify').addEventListener('click', async ()=>{
    const body = {
      title: 'Hora de repasar!',
      message: 'Haz 5 ejercicios de coordenadas por 5 minutos 😊',
      url: '/juego.html'
    };
    const resp = await fetch('/sendNotification', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await resp.json();
    alert('Notificación enviada (intento). Revisar consola del servidor.');
    console.log('sendNotification result', data);
  });

  // Mini-board example: add points so the lesson feels interactive
  function renderMiniBoard(){
    const box = document.getElementById('miniBoard');
    if(!box) return;
    box.style.width = '240px';
    box.style.height = '240px';
    box.style.margin='8px 0';
    box.style.position='relative';
    box.style.background = 'repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0 1px, transparent 1px 30px), repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0 1px, transparent 1px 30px)';
    const pts = [[3,2],[-2,1],[0,0],[1,-3]];
    const unit = 12;
    const cx = 120, cy = 120;
    pts.forEach((p,i)=>{
      const el = document.createElement('button');
      el.className = 'dot';
      el.style.position='absolute';
      el.style.left = (cx + p[0]*unit - 10) + 'px';
      el.style.top = (cy - p[1]*unit - 10) + 'px';
      el.textContent = i+1;
      el.title = `(${p[0]}, ${p[1]})`;
      el.addEventListener('click', ()=> alert(`Punto ${i+1}: (${p[0]}, ${p[1]})`));
      box.appendChild(el);
    });
  }
  renderMiniBoard();

})();
