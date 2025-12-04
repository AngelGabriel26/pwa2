/* ==================================================
   app.js - Coordenadas Cartesianas
   Sistema completo con cuadrículas numeradas
   ================================================== */

(function () {
  'use strict';

  // ===== UTILIDADES =====
  function rand(range = 6) { 
    return Math.floor(Math.random() * (range * 2 + 1)) - range; 
  }
  
  function clamp(v, a, b) { 
    return Math.max(a, Math.min(b, v)); 
  }

  function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  // ===== NOTIFICACIONES =====
  async function ensureNotifications() {
    if (!('Notification' in window)) {
      alert('Notificaciones no soportadas en este navegador');
      return false;
    }
    if (Notification.permission === 'granted') return true;
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }

  async function localNotify(title, message, url = '/') {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification(title, {
          body: message,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          data: { url },
          vibrate: [200, 100, 200]
        });
      } else if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, { 
          body: message, 
          icon: '/icons/icon-192.png',
          vibrate: [200, 100, 200]
        });
        notification.onclick = () => {
          window.focus();
          window.location.href = url;
        };
      }
    } catch (e) {
      console.error('localNotify error', e);
    }
  }

  // ===== RENDERIZAR CUADRÍCULA NUMERADA =====
  function renderGridBoard(containerId, points = [], showNumbers = true) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    const containerSize = container.clientWidth || 600;
    container.style.width = containerSize + 'px';
    container.style.height = containerSize + 'px';
    container.style.position = 'relative';
    container.style.background = 'white';

    const gridSize = 20; // -10 a 10
    const cellSize = containerSize / gridSize;
    const centerX = gridSize / 2;
    const centerY = gridSize / 2;

    // Dibujar líneas de cuadrícula
    for (let i = 0; i <= gridSize; i++) {
      // Líneas verticales
      const vLine = document.createElement('div');
      vLine.style.cssText = `
        position: absolute;
        left: ${i * cellSize}px;
        top: 0;
        width: 1px;
        height: 100%;
        background: ${i === centerX ? '#3B82F6' : '#E5E7EB'};
        opacity: ${i === centerX ? '0.8' : '0.3'};
      `;
      container.appendChild(vLine);

      // Líneas horizontales
      const hLine = document.createElement('div');
      hLine.style.cssText = `
        position: absolute;
        top: ${i * cellSize}px;
        left: 0;
        height: 1px;
        width: 100%;
        background: ${i === centerY ? '#3B82F6' : '#E5E7EB'};
        opacity: ${i === centerY ? '0.8' : '0.3'};
      `;
      container.appendChild(hLine);
    }

    // Números en el eje X
    if (showNumbers) {
      for (let x = -10; x <= 10; x++) {
        if (x === 0) continue;
        const label = document.createElement('div');
        label.style.cssText = `
          position: absolute;
          left: ${(centerX + x) * cellSize}px;
          top: ${centerY * cellSize + 4}px;
          transform: translateX(-50%);
          font-size: ${containerSize > 400 ? '11px' : '9px'};
          font-weight: 600;
          color: #3B82F6;
          pointer-events: none;
        `;
        label.textContent = x;
        container.appendChild(label);
      }

      // Números en el eje Y
      for (let y = -10; y <= 10; y++) {
        if (y === 0) continue;
        const label = document.createElement('div');
        label.style.cssText = `
          position: absolute;
          left: ${centerX * cellSize + 4}px;
          top: ${(centerY - y) * cellSize}px;
          transform: translateY(-50%);
          font-size: ${containerSize > 400 ? '11px' : '9px'};
          font-weight: 600;
          color: #10B981;
          pointer-events: none;
        `;
        label.textContent = y;
        container.appendChild(label);
      }

      // Origen (0,0)
      const originLabel = document.createElement('div');
      originLabel.style.cssText = `
        position: absolute;
        left: ${centerX * cellSize - 16}px;
        top: ${centerY * cellSize + 4}px;
        font-size: ${containerSize > 400 ? '12px' : '10px'};
        font-weight: 700;
        color: #6B7280;
        pointer-events: none;
      `;
      originLabel.textContent = '0';
      container.appendChild(originLabel);
    }

    // Etiquetas de ejes
    const xLabel = document.createElement('div');
    xLabel.style.cssText = `
      position: absolute;
      right: 8px;
      top: ${centerY * cellSize - 20}px;
      font-size: 14px;
      font-weight: 700;
      color: #3B82F6;
      background: white;
      padding: 2px 6px;
      border-radius: 4px;
    `;
    xLabel.textContent = 'X';
    container.appendChild(xLabel);

    const yLabel = document.createElement('div');
    yLabel.style.cssText = `
      position: absolute;
      left: ${centerX * cellSize + 8}px;
      top: 8px;
      font-size: 14px;
      font-weight: 700;
      color: #10B981;
      background: white;
      padding: 2px 6px;
      border-radius: 4px;
    `;
    yLabel.textContent = 'Y';
    container.appendChild(yLabel);

    // Dibujar puntos
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'];
    points.forEach((p, i) => {
      const px = (centerX + p.x) * cellSize;
      const py = (centerY - p.y) * cellSize;
      
      const dot = document.createElement('button');
      dot.className = 'dot';
      dot.style.left = (px - 18) + 'px';
      dot.style.top = (py - 18) + 'px';
      dot.style.background = colors[i % colors.length];
      dot.textContent = (i + 1);
      dot.title = `Punto ${i + 1}: (${p.x}, ${p.y})`;
      
      dot.addEventListener('click', () => {
        vibrate(60);
        const hint = document.getElementById('miniBoardHint');
        if (hint) {
          hint.textContent = `✅ Punto ${i + 1}: (${p.x}, ${p.y}) — X=${p.x} (${p.x > 0 ? 'derecha' : p.x < 0 ? 'izquierda' : 'centro'}), Y=${p.y} (${p.y > 0 ? 'arriba' : p.y < 0 ? 'abajo' : 'centro'})`;
          hint.style.background = 'linear-gradient(135deg, #D1FAE5 0%, #F0FDF4 100%)';
          hint.style.border = '2px solid #10B981';
        }
      });
      
      container.appendChild(dot);
    });
  }

  // ===== PÁGINA: LECCIÓN =====
  if (document.body.id === 'page-lesson') {
    const lessonPoints = [
      { x: 3, y: 4 },
      { x: -4, y: 3 },
      { x: 5, y: -2 },
      { x: -3, y: -4 },
      { x: 0, y: 0 }
    ];
    
    setTimeout(() => {
      renderGridBoard('miniBoardLesson', lessonPoints, true);
    }, 100);

    const btnActivities = document.getElementById('goActivities');
    const btnExam = document.getElementById('goExam');
    const btnNotify = document.getElementById('btnNotify');
    const btnNotifyTest = document.getElementById('btnNotifyTest');

    if (btnActivities) {
      btnActivities.addEventListener('click', () => location.href = 'actividades.html');
    }
    
    if (btnExam) {
      btnExam.addEventListener('click', () => location.href = 'examen.html');
    }

    if (btnNotify) {
      btnNotify.addEventListener('click', async () => {
        const ok = await ensureNotifications();
        if (!ok) return alert('Permiso de notificaciones no concedido 😢');
        
        alert('🔔 ¡Recordatorios activados! Recibirás notificaciones para practicar.');
        
        // Recordatorio inicial
        setTimeout(() => {
          localNotify(
            '📐 Hora de practicar',
            'Resuelve 5 ejercicios de coordenadas ahora',
            'actividades.html'
          );
        }, 30000);
        
        // Recordatorios periódicos
        const interval = setInterval(() => {
          localNotify(
            '📍 Practica coordenadas',
            'Ubica el punto (3, -2) en el plano',
            'actividades.html'
          );
        }, 120000);
        
        window._mathReminderInterval = interval;
      });
    }

    if (btnNotifyTest) {
      btnNotifyTest.addEventListener('click', async () => {
        const ok = await ensureNotifications();
        if (!ok) return alert('Permiso no concedido');
        
        await localNotify(
          '🎯 Recordatorio de prueba',
          'Abre Actividades y practica coordenadas',
          'actividades.html'
        );
        alert('✅ Notificación enviada correctamente.');
      });
    }
  }

  // ===== PÁGINA: ACTIVIDADES =====
  if (document.body.id === 'page-activities') {
    let currentExercise1 = { x: 0, y: 0 };
    let currentExercise2 = { x: 0, y: 0, correct: 'I' };
    let currentExercise3 = { x: 0, y: 0 };

    // EJERCICIO 1: Identificar coordenadas
    function initExercise1() {
      const boardContainer = document.querySelector('.exercise-board-container');
      const inputX = document.getElementById('inputX');
      const inputY = document.getElementById('inputY');
      const checkBtn = document.getElementById('checkBtn');
      const newBtn = document.getElementById('newBtn');
      const feedback = document.getElementById('activityFeedback');

      function newProblem() {
        currentExercise1 = {
          x: clamp(rand(5), -8, 8),
          y: clamp(rand(5), -8, 8)
        };
        
        // Recrear el contenedor del tablero
        if (boardContainer) {
          boardContainer.innerHTML = '<div class="board" id="activityBoard"></div>';
          const newBoard = document.getElementById('activityBoard');
          if (newBoard) {
            newBoard.style.width = '400px';
            newBoard.style.height = '400px';
            renderGridBoard('activityBoard', [currentExercise1], true);
          }
        }

        if (inputX) inputX.value = '';
        if (inputY) inputY.value = '';
        if (feedback) {
          feedback.className = 'feedback-message';
          feedback.textContent = '';
        }
      }

      if (checkBtn) {
        checkBtn.addEventListener('click', () => {
          const xi = parseInt(inputX.value, 10);
          const yi = parseInt(inputY.value, 10);
          
          if (Number.isNaN(xi) || Number.isNaN(yi)) {
            feedback.textContent = '⚠️ Por favor escribe números enteros para X e Y';
            feedback.className = 'feedback-message error show';
            return;
          }
          
          if (xi === currentExercise1.x && yi === currentExercise1.y) {
            feedback.textContent = `🎉 ¡Excelente! La coordenada (${xi}, ${yi}) es correcta`;
            feedback.className = 'feedback-message success show';
            vibrate(120);
            localNotify('¡Correcto!', 'Has identificado la coordenada correctamente', 'actividades.html');
          } else {
            feedback.textContent = `❌ Incorrecto. La respuesta correcta es (${currentExercise1.x}, ${currentExercise1.y})`;
            feedback.className = 'feedback-message error show';
            vibrate([60, 30, 60]);
          }
        });
      }

      if (newBtn) newBtn.addEventListener('click', newProblem);
      newProblem();
    }

    // EJERCICIO 2: Identificar cuadrante
    function initExercise2() {
      const coordDisplay = document.getElementById('quadrantCoord');
      const options = document.getElementById('quadrantOptions');
      const feedback = document.getElementById('quadrantFeedback');
      const newBtn = document.getElementById('newQuadrantBtn');

      function getQuadrant(x, y) {
        if (x === 0 && y === 0) return 'Origen';
        if (x === 0) return 'Eje Y';
        if (y === 0) return 'Eje X';
        if (x > 0 && y > 0) return 'I';
        if (x < 0 && y > 0) return 'II';
        if (x < 0 && y < 0) return 'III';
        if (x > 0 && y < 0) return 'IV';
      }

      function newQuestion() {
        currentExercise2 = {
          x: rand(6),
          y: rand(6)
        };
        currentExercise2.correct = getQuadrant(currentExercise2.x, currentExercise2.y);
        
        if (coordDisplay) {
          coordDisplay.innerHTML = `<span class="coord-badge">(${currentExercise2.x}, ${currentExercise2.y})</span>`;
        }
        
        if (options) {
          options.querySelectorAll('.quadrant-btn').forEach(btn => {
            btn.classList.remove('selected');
          });
        }
        
        if (feedback) {
          feedback.className = 'feedback-message';
          feedback.textContent = '';
        }
      }

      if (options) {
        options.addEventListener('click', (e) => {
          const btn = e.target.closest('.quadrant-btn');
          if (!btn) return;
          
          options.querySelectorAll('.quadrant-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          
          const chosen = btn.dataset.quadrant;
          if (chosen === currentExercise2.correct) {
            feedback.textContent = `🎉 ¡Correcto! El punto está en ${chosen === 'Origen' ? 'el Origen' : chosen === 'Eje X' || chosen === 'Eje Y' ? 'el ' + chosen : 'el Cuadrante ' + chosen}`;
            feedback.className = 'feedback-message success show';
            vibrate(120);
          } else {
            feedback.textContent = `❌ Incorrecto. El punto (${currentExercise2.x}, ${currentExercise2.y}) está en ${currentExercise2.correct === 'Origen' ? 'el Origen' : currentExercise2.correct === 'Eje X' || currentExercise2.correct === 'Eje Y' ? 'el ' + currentExercise2.correct : 'el Cuadrante ' + currentExercise2.correct}`;
            feedback.className = 'feedback-message error show';
            vibrate([60, 30, 60]);
          }
        });
      }

      if (newBtn) newBtn.addEventListener('click', newQuestion);
      newQuestion();
    }

    // EJERCICIO 3: Ubicar punto
    function initExercise3() {
      const boardWrapper = document.querySelector('.interactive-board-wrapper');
      const coordDisplay = document.getElementById('placePointCoord');
      const feedback = document.getElementById('placeFeedback');
      const newBtn = document.getElementById('newPlaceBtn');

      function newChallenge() {
        currentExercise3 = {
          x: clamp(rand(5), -8, 8),
          y: clamp(rand(5), -8, 8)
        };
        
        if (coordDisplay) {
          coordDisplay.innerHTML = `<span class="coord-badge">(${currentExercise3.x}, ${currentExercise3.y})</span>`;
        }
        
        if (boardWrapper) {
          boardWrapper.innerHTML = '<div class="board clickable-board" id="placeBoard"></div>';
          const newBoard = document.getElementById('placeBoard');
          if (newBoard) {
            newBoard.style.width = '400px';
            newBoard.style.height = '400px';
            renderGridBoard('placeBoard', [], true);
            
            // Agregar evento de clic
            newBoard.addEventListener('click', (e) => {
              const rect = newBoard.getBoundingClientRect();
              const size = rect.width;
              const gridSize = 20;
              const cellSize = size / gridSize;
              const centerX = gridSize / 2;
              const centerY = gridSize / 2;
              
              const mx = e.clientX - rect.left;
              const my = e.clientY - rect.top;
              
              const clickedX = Math.round(mx / cellSize - centerX);
              const clickedY = Math.round(centerY - my / cellSize);
              
              // Eliminar puntos anteriores
              const dots = newBoard.querySelectorAll('.dot');
              dots.forEach(d => d.remove());
              
              // Agregar nuevo punto
              const px = (centerX + clickedX) * cellSize;
              const py = (centerY - clickedY) * cellSize;
              
              const dot = document.createElement('div');
              dot.className = 'dot';
              dot.style.left = (px - 18) + 'px';
              dot.style.top = (py - 18) + 'px';
              dot.style.background = '#10B981';
              dot.textContent = '📍';
              newBoard.appendChild(dot);
              
              // Verificar
              if (clickedX === currentExercise3.x && clickedY === currentExercise3.y) {
                feedback.textContent = `🎉 ¡Perfecto! Has ubicado correctamente el punto (${currentExercise3.x}, ${currentExercise3.y})`;
                feedback.className = 'feedback-message success show';
                vibrate(120);
              } else {
                feedback.textContent = `❌ Seleccionaste (${clickedX}, ${clickedY}). El punto correcto es (${currentExercise3.x}, ${currentExercise3.y})`;
                feedback.className = 'feedback-message error show';
                vibrate([60, 30, 60]);
              }
            });
          }
        }
        
        if (feedback) {
          feedback.className = 'feedback-message';
          feedback.textContent = '';
        }
      }

      if (newBtn) newBtn.addEventListener('click', newChallenge);
      newChallenge();
    }

    initExercise1();
    initExercise2();
    initExercise3();
  }

  // ===== PÁGINA: EXAMEN =====
  if (document.body.id === 'page-exam') {
    const examContainer = document.getElementById('examContainer');
    const submitBtn = document.getElementById('submitExam');
    const regenBtn = document.getElementById('regenExam');
    const resultContainer = document.getElementById('examResultContainer');
    const retakeBtn = document.getElementById('retakeExam');
    
    let problems = [];
    let startTime = 0;
    let timerInterval = null;

    function startTimer() {
      startTime = Date.now();
      const display = document.getElementById('timerDisplay');
      
      if (timerInterval) clearInterval(timerInterval);
      
      timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        if (display) {
          display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
      }, 1000);
    }

    function stopTimer() {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }

    function createQuestion(index, point) {
      const wrapper = document.createElement('div');
      wrapper.className = 'exam-question';
      
      const header = document.createElement('div');
      header.className = 'question-header';
      header.innerHTML = `
        <div class="question-number">Pregunta ${index + 1}</div>
        <div class="question-points">1 punto</div>
      `;
      wrapper.appendChild(header);

      // Tablero mini
      const boardWrapper = document.createElement('div');
      boardWrapper.className = 'question-board-wrapper';
      
      const board = document.createElement('div');
      board.className = 'board question-board';
      board.id = `exam-board-${index}`;
      board.style.width = '300px';
      board.style.height = '300px';
      boardWrapper.appendChild(board);
      wrapper.appendChild(boardWrapper);

      // Renderizar cuadrícula con el punto
      setTimeout(() => {
        renderGridBoard(`exam-board-${index}`, [point], true);
      }, 50);

      // Inputs
      const inputsDiv = document.createElement('div');
      inputsDiv.className = 'question-inputs';
      
      const inputX = document.createElement('input');
      inputX.type = 'number';
      inputX.className = 'coord-input';
      inputX.placeholder = 'X';
      
      const inputY = document.createElement('input');
      inputY.type = 'number';
      inputY.className = 'coord-input';
      inputY.placeholder = 'Y';
      
      inputsDiv.appendChild(inputX);
      inputsDiv.appendChild(inputY);
      wrapper.appendChild(inputsDiv);

      // Feedback
      const feedback = document.createElement('div');
      feedback.className = 'question-feedback';
      wrapper.appendChild(feedback);

      return { wrapper, inputX, inputY, feedback };
    }

    function genExam() {
      problems = [];
      examContainer.innerHTML = '';
      
      for (let i = 0; i < 10; i++) {
        const point = { 
          x: clamp(rand(6), -8, 8), 
          y: clamp(rand(6), -8, 8) 
        };
        const question = createQuestion(i, point);
        examContainer.appendChild(question.wrapper);
        problems.push({ point, elements: question });
      }
      
      if (resultContainer) resultContainer.style.display = 'none';
      startTimer();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function gradeExam() {
      stopTimer();
      let correct = 0;
      
      problems.forEach((item, index) => {
        const xi = parseInt(item.elements.inputX.value, 10);
        const yi = parseInt(item.elements.inputY.value, 10);
        const isCorrect = !Number.isNaN(xi) && !Number.isNaN(yi) && 
                          xi === item.point.x && yi === item.point.y;
        
        item.elements.feedback.classList.add('show');
        if (isCorrect) {
          item.elements.feedback.textContent = '✅ Correcto';
          item.elements.feedback.classList.add('correct');
          correct++;
        } else {
          item.elements.feedback.textContent = `❌ Incorrecto — Respuesta: (${item.point.x}, ${item.point.y})`;
          item.elements.feedback.classList.add('incorrect');
        }
      });
      
      const pct = Math.round((correct / problems.length) * 100);
      
      // Guardar resultado
      const result = {
        date: Date.now(),
        correct,
        total: problems.length,
        percentage: pct
      };
      localStorage.setItem('math_exam_result', JSON.stringify(result));
      
      // Mostrar resultados
      document.getElementById('correctAnswers').textContent = correct;
      document.getElementById('incorrectAnswers').textContent = problems.length - correct;
      document.getElementById('finalScore').textContent = pct + '%';
      
      const resultIcon = document.getElementById('resultIcon');
      const resultMessage = document.getElementById('resultMessage');
      
      if (pct >= 90) {
        resultIcon.textContent = '🎉';
        resultMessage.textContent = '¡Excelente! Dominas las coordenadas cartesianas.';
        resultMessage.style.background = 'linear-gradient(135deg, #D1FAE5 0%, #F0FDF4 100%)';
        resultMessage.style.borderColor = '#10B981';
      } else if (pct >= 70) {
        resultIcon.textContent = '😊';
        resultMessage.textContent = '¡Muy bien! Vas por buen camino. Sigue practicando.';
        resultMessage.style.background = 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)';
        resultMessage.style.borderColor = '#F59E0B';
      } else {
        resultIcon.textContent = '💪';
        resultMessage.textContent = 'Sigue practicando. Repasa la lección y vuelve a intentarlo.';
        resultMessage.style.background = 'linear-gradient(135deg, #FEE2E2 0%, #FEF2F2 100%)';
        resultMessage.style.borderColor = '#DC2626';
      }
      
      resultContainer.style.display = 'block';
      resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Notificación
      ensureNotifications().then(ok => {
        if (ok) {
          localNotify(
            '📝 Examen completado',
            `Obtuviste ${pct}% (${correct}/${problems.length} correctas)`,
            'examen.html'
          );
        }
      });
      
      vibrate([80, 30, 80, 30, 80]);
    }

    if (submitBtn) submitBtn.addEventListener('click', gradeExam);
    if (regenBtn) regenBtn.addEventListener('click', genExam);
    if (retakeBtn) retakeBtn.addEventListener('click', () => {
      genExam();
      resultContainer.style.display = 'none';
    });

    genExam();
  }

  // ===== REGISTRAR SERVICE WORKER =====
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('✅ Service Worker registrado:', reg.scope))
      .catch(err => console.warn('⚠️ SW register failed:', err));
  }

})();