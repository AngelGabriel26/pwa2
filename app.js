/* ==================================================
   app.js - Potencia y Raíz Cuadrada (versión robusta)
   Sistema completo con lógica aritmética + Splash Screen
   ================================================== */

(function () {
  'use strict';

  // ===== SPLASH SCREEN HANDLER =====
  function initSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    const body = document.body;

    if (!splashScreen) return;

    // Esperar 1.5 segundos antes de ocultar la splash screen
    setTimeout(() => {
      // Agregar clase fade-out para la animación
      splashScreen.classList.add('fade-out');
      
      // Marcar el body como cargado
      body.classList.remove('loading');
      body.classList.add('loaded');

      // Eliminar el splash screen del DOM después de la animación
      setTimeout(() => {
        splashScreen.remove();
      }, 500); // 500ms = duración de la animación fadeOut
    }, 1500); // 1500ms = 1.5 segundos
  }

  // ===== UTILIDADES =====
  /** Genera un entero aleatorio entre min y max (inclusive). */
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function vibrate(pattern) {
    if (navigator && typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
  }

  // ===== LÓGICA ARITMÉTICA (Potencia y Raíz) =====
  /** Genera un problema aleatorio: Potencia o Raíz Cuadrada. */
  function generateProblem() {
    const isPower = Math.random() < 0.5;

    if (isPower) {
      const base = randInt(2, 9);
      const exponent = randInt(2, 4);
      const answer = Math.pow(base, exponent);

      let exponentText = '';
      if (exponent === 2) exponentText = 'al cuadrado';
      else if (exponent === 3) exponentText = 'al cubo';
      else exponentText = `a la ${exponent}`;

      return {
        type: 'potencia',
        question: `<span class="base-number">${base}</span><span class="exponent-number">${exponent}</span>`,
        answer: answer,
        details: `${base} multiplicado por sí mismo ${exponent} veces es ${answer}.`,
        instruction: `Calcula la Potencia: ${base} elevado ${exponentText}.`
      };
    } else {
      const root = randInt(4, 12);
      const radicand = root * root;

      return {
        type: 'raiz',
        question: `√<span class="radicand-number">${radicand}</span>`,
        answer: root,
        details: `La raíz es ${root}, porque ${root} × ${root} = ${radicand}.`,
        instruction: `Calcula la Raíz Cuadrada de ${radicand}.`
      };
    }
  }

  let currentProblem = null;

  /**
   * Renderiza el ejercicio interactivo en la página de lección (index.html).
   * Es robusto ante elementos faltantes en el DOM.
   */
  function renderInteractiveLesson() {
    const container = document.getElementById('interactiveLesson');
    if (!container) return;

    // Generar nuevo problema
    currentProblem = generateProblem();
    container.innerHTML = '';

    // Contenedor de pregunta
    const questionDiv = document.createElement('div');
    questionDiv.className = 'interactive-question';
    questionDiv.innerHTML = `<p class="instruction">${currentProblem.instruction}</p>
                             <div class="math-problem">${currentProblem.question}</div>`;

    // Input de respuesta
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-section';
    inputGroup.innerHTML = `
      <div class="input-group">
        <label for="inputAnswer">Tu Respuesta:</label>
        <input id="inputAnswer" class="coord-input" type="number" placeholder="Resultado" min="0" style="max-width: 120px;">
      </div>
    `;

    // Botones: Verificar y Nuevo
    const checkBtn = document.createElement('button');
    checkBtn.id = 'checkAnswerBtn';
    checkBtn.className = 'btn btn-primary';
    checkBtn.innerHTML = '<span class="btn-icon">✅</span> Verificar';

    const newBtn = document.createElement('button');
    newBtn.id = 'newProblemBtn';
    newBtn.className = 'btn btn-outline';
    newBtn.style.marginLeft = '10px';
    newBtn.innerHTML = '<span class="btn-icon">🔄</span> Nuevo';
    newBtn.addEventListener('click', renderInteractiveLesson);

    // Feedback (si no existe, lo creamos aquí para evitar null references)
    let feedbackEl = document.getElementById('interactiveHint');
    if (!feedbackEl) {
      feedbackEl = document.createElement('div');
      feedbackEl.id = 'interactiveHint';
      feedbackEl.className = 'hint-box';
      // Lo insertamos al final del container para que el usuario lo vea
      container.appendChild(feedbackEl);
    }

    // Lógica de verificación (protegida contra inputs faltantes)
    checkBtn.addEventListener('click', () => {
      const input = document.getElementById('inputAnswer');
      const val = input ? input.value : null;
      const userAnswer = parseInt(val, 10);

      if (isNaN(userAnswer)) {
        feedbackEl.innerHTML = '⚠️ Por favor, ingresa un número.';
        feedbackEl.className = 'hint-box hint-warning';
        return;
      }

      if (userAnswer === currentProblem.answer) {
        feedbackEl.innerHTML = `🥳 ¡Correcto! ${currentProblem.details}`;
        feedbackEl.className = 'hint-box hint-success';
        vibrate([100, 50, 100]);
        if (input) input.disabled = true;
        checkBtn.disabled = true;
      } else {
        feedbackEl.innerHTML = `❌ Incorrecto. Vuelve a intentarlo o presiona "Nuevo".`;
        feedbackEl.className = 'hint-box hint-error';
        vibrate([200]);
      }
    });

    // Añadir todo al DOM (aseguramos orden lógico)
    container.appendChild(questionDiv);
    container.appendChild(inputGroup);
    container.appendChild(checkBtn);
    container.appendChild(newBtn);

    // Mensaje inicial
    feedbackEl.innerHTML = '👆 El objetivo es practicar para que no olvides las reglas.';
    feedbackEl.className = 'hint-box';
  }

  // =================================================================
  // Manejo de eventos (navegación y notificaciones)
  // =================================================================

  function setupEventHandlers() {
    // Encapsulamos todo en try/catch para evitar que un error aquí bloquee todo.
    try {
      const goActivities = document.getElementById('goActivities');
      if (goActivities) {
        goActivities.addEventListener('click', () => {
          window.location.href = 'actividades.html';
        });
      }

      const goExam = document.getElementById('goExam');
      if (goExam) {
        goExam.addEventListener('click', () => {
          window.location.href = 'examen.html';
        });
      }

      const btnNotify = document.getElementById('btnNotify');
      if (btnNotify) {
        btnNotify.addEventListener('click', () => {
          // Mensaje informativo; la lógica de push está en client.js
          alert('Esta acción será manejada por client.js al cargar la página. Si no has visto la solicitud de permiso, recarga.');
        });
      }

      const btnNotifyTest = document.getElementById('btnNotifyTest');
      if (btnNotifyTest) {
        btnNotifyTest.addEventListener('click', async () => {
          // Proteger llamadas asíncronas
          try {
            await ensureNotifications();
            localNotify(
              '🔔 Prueba de Recordatorio',
              '¡Esto es una notificación de prueba! Puedes desactivarlas en la configuración de tu navegador.',
              'index.html'
            );
            vibrate([50, 50, 50]);
          } catch (err) {
            console.warn('Error al probar notificación:', err);
          }
        });
      }
    } catch (err) {
      // No dejamos que un fallo aquí detenga la ejecución del resto del script
      console.error('setupEventHandlers falló:', err);
    }
  }

  // ===== NOTIFICACIONES =====
  async function ensureNotifications() {
    if (!('Notification' in window)) {
      console.warn('Notificaciones no soportadas en este navegador');
      return false;
    }
    if (Notification.permission === 'granted') return true;
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }

  async function localNotify(title, message, url = './') {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        const reg = await navigator.serviceWorker.ready;
        // reg.showNotification puede fallar en algunos navegadores si no hay permiso
        await reg.showNotification(title, {
          body: message,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          data: { url },
          vibrate: [200, 100, 200]
        });
      } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: message });
      }
    } catch (err) {
      console.error('Error al mostrar notificación', err);
    }
  }

  // ===== INICIALIZACIÓN =====
  // Ejecutar cuando el DOM esté listo para evitar condiciones de carrera entre scripts
  document.addEventListener('DOMContentLoaded', () => {
    try {
      // Inicializar splash screen PRIMERO
      initSplashScreen();

      // Solo si estamos en la lección (index.html) renderizamos el ejercicio interactivo
      if (document.getElementById('page-lesson')) {
        renderInteractiveLesson();
      }

      // Configurar handlers (es seguro llamarlo en cualquier página)
      setupEventHandlers();
    } catch (err) {
      // Log pero no romper
      console.error('Inicialización app.js falló:', err);
    }
  });

  // Exponer API sencilla para otros módulos (ej. examen.js)
  window.app = window.app || {
    randInt,
    vibrate,
    localNotify,
    ensureNotifications
  };

})();