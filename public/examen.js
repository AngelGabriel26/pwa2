// examen.js - genera 10 preguntas de Potencia y Raíz Cuadrada con 4 opciones
(function () {
    'use strict';

    // ------------------------------
    // 1. OBTENER ELEMENTOS DEL DOM
    // ------------------------------

    const quizEl = document.getElementById('quiz');
    const submitBtn = document.getElementById('submitExam');
    const resultContainer = document.getElementById('examResultContainer');

    // Si no encuentra el contenedor, no continúa
    if (!quizEl) return;

    let questions = [];
    let selections = [];

    // -----------------------------------------
    // UTILIDADES
    // -----------------------------------------

    /** Genera un número entero aleatorio entre min y max (incluye ambos). */
    function randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // -----------------------------------------
    // GENERACIÓN DE PREGUNTAS
    // -----------------------------------------

    /**
     * Crea una pregunta de potencia o raíz.
     * Devuelve:
     *  - question: texto HTML de la pregunta
     *  - correct: número correcto
     *  - options: arreglo de opciones mezcladas
     */
    function makeQuestion() {
        let type, questionString, correctAnswer;

        const isPower = Math.random() < 0.5;

        // ----------- POTENCIA -----------
        if (isPower) {
            const base = randInt(2, 6);
            const exponent = randInt(2, 4);

            correctAnswer = Math.pow(base, exponent);

            // 🔥 Eliminamos los ** que rompían el DOM.
            questionString =
                `¿Cuál es el resultado de ` +
                `${base}<span class="exponent-number">${exponent}</span>?`;

            type = 'potencia';

        } else {
            // ----------- RAÍZ CUADRADA -----------
            const root = randInt(4, 12);
            const radicand = root * root;

            correctAnswer = root;

            questionString =
                `¿Cuál es la raíz cuadrada de ` +
                `√<span class="radicand-number">${radicand}</span>?`;

            type = 'raiz';
        }

        // -----------------------------
        // GENERACIÓN DE OPCIONES
        // -----------------------------
        const options = new Set();
        options.add(correctAnswer);

        // Distractor cercano
        options.add(correctAnswer + (Math.random() > 0.5 ? 1 : -1) * randInt(1, 2));

        // Distractor especial para potencias (base * exponente)
        if (type === 'potencia') {
            const tryValue = correctAnswer / randInt(2, 3); // opcional, distractor alterno
            if (tryValue !== correctAnswer && tryValue > 0) {
                options.add(Math.floor(tryValue));
            }
        }

        // Rellenar hasta 4 opciones
        while (options.size < 4) {
            let distractor = randInt(Math.max(2, correctAnswer - 5), correctAnswer + 15);
            if (distractor > 0) options.add(distractor);
        }

        let finalOptions = Array.from(options);

        // Mezclar
        finalOptions.sort(() => Math.random() - 0.5);

        return { question: questionString, correct: correctAnswer, options: finalOptions };
    }

    // -----------------------------------------
    // RENDERIZAR EXAMEN COMPLETO EN EL DOM
    // -----------------------------------------

    function renderExam() {
        quizEl.innerHTML = '';

        questions.forEach((q, i) => {
            // Contenedor por pregunta
            const div = document.createElement('div');
            div.className = 'question-block card';
            div.style.animationDelay = `${i * 0.1}s`;

            // Texto de la pregunta
            const questionHeader = document.createElement('div');
            questionHeader.className = 'question-header';
            questionHeader.innerHTML = `
                <span class="question-number">${i + 1}.</span>
                <div class="math-question-text">${q.question}</div>
            `;

            // Contenedor de opciones
            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'options-container';
            optionsContainer.id = `options-${i}`;

            // Icono de feedback (correcto/incorrecto)
            const feedbackIcon = document.createElement('div');
            feedbackIcon.className = 'feedback-icon';
            feedbackIcon.id = `feedback-${i}`;

            // Crear los botones de opciones
            q.options.forEach(option => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-option';
                btn.textContent = option;
                btn.dataset.value = option;

                // Marcar si está seleccionada
                if (selections[i] === option) {
                    btn.classList.add('selected');
                }

                // Evento de selección
                btn.addEventListener('click', () => {
                    optionsContainer.querySelectorAll('.btn-option')
                        .forEach(b => b.classList.remove('selected'));

                    btn.classList.add('selected');
                    selections[i] = option;
                });

                optionsContainer.appendChild(btn);
            });

            // Añadir elementos al DOM
            div.appendChild(questionHeader);
            div.appendChild(optionsContainer);
            div.appendChild(feedbackIcon);
            quizEl.appendChild(div);

            setTimeout(() => {
    div.classList.add('loaded');
}, (i * 100) + 500);

        });
    }

    // -----------------------------------------
    // GENERAR NUEVO EXAMEN
    // -----------------------------------------

    function genExam() {
        questions = Array.from({ length: 10 }, () => makeQuestion());
        selections = new Array(questions.length).fill(null);

        renderExam();

        if (resultContainer)
            resultContainer.style.display = 'none';
    }

    // -----------------------------------------
    // CALIFICAR EXAMEN
    // -----------------------------------------

    function gradeExam() {
        let correctCount = 0;
        const totalQuestions = questions.length;

        // Tiempo
        const startTime = localStorage.getItem('examStartTime');
        const endTime = Date.now();
        let durationMinutes = 0;

        if (startTime)
            durationMinutes = Math.round((endTime - parseInt(startTime)) / 60000);

        // Revisar cada respuesta
        questions.forEach((q, i) => {
            const selected = selections[i];
            const isCorrect = selected === q.correct;

            const feedbackIcon = document.getElementById(`feedback-${i}`);
            const optionsContainer = document.getElementById(`options-${i}`);

            if (feedbackIcon) {
                feedbackIcon.textContent = isCorrect ? '✅' : '❌';
                feedbackIcon.className = isCorrect
                    ? 'feedback-icon feedback-success'
                    : 'feedback-icon feedback-error';

                feedbackIcon.style.display = 'block';

                // Deshabilitar todas las opciones
                optionsContainer.querySelectorAll('.btn-option').forEach(btn => {
                    const val = parseInt(btn.dataset.value);
                    btn.disabled = true;

                    if (val === q.correct)
                        btn.classList.add('correct');
                    else if (val === selected)
                        btn.classList.add('incorrect-selection');
                });
            }

            if (isCorrect) correctCount++;
        });

        // Calificación final
        const pct = Math.round((correctCount / totalQuestions) * 100);

        document.getElementById('examResultPct').textContent = `${pct}%`;
        document.getElementById('examResultScore').textContent =
            `${correctCount} de ${totalQuestions} correctas`;
        document.getElementById('examResultTime').textContent =
            `${durationMinutes} minutos`;

        let icon = '';
        let msg = '';

        if (pct >= 90) {
            icon = '🏆';
            msg = '¡Excelente trabajo! Dominaste el tema.';
        } else if (pct >= 70) {
            icon = '🎉';
            msg = '¡Buen trabajo! Solo revisa tus errores.';
        } else {
            icon = '🧐';
            msg = 'Necesitas repasar un poco más el tema.';
        }

        document.getElementById('resultIcon').textContent = icon;
        document.getElementById('resultMessage').textContent = msg;

        // Mostrar contenedor final
        resultContainer.style.display = 'block';
        resultContainer.scrollIntoView({ behavior: 'smooth' });

        localStorage.setItem('examStartTime', '');
    }

    // -----------------------------------------
    // EVENTOS DEL EXAMEN
    // -----------------------------------------

    function setupEvents() {
        const regenBtn = document.getElementById('regenExam');
        const submitBtn = document.getElementById('submitExam');
        const retakeBtn = document.getElementById('retakeExam');

        // Generar nuevo examen
        if (regenBtn)
            regenBtn.addEventListener('click', () => {
                localStorage.setItem('examStartTime', Date.now());
                genExam();
            });

        // Rehacer el examen sin cambiar preguntas
        if (retakeBtn)
            retakeBtn.addEventListener('click', () => {
                localStorage.setItem('examStartTime', Date.now());
                selections = new Array(questions.length).fill(null);
                renderExam();
                resultContainer.style.display = 'none';
            });

        // Calificar examen
        if (submitBtn)
            submitBtn.addEventListener('click', gradeExam);
    }

    // -----------------------------------------
    // INICIALIZACIÓN GENERAL
    // -----------------------------------------

    localStorage.setItem('examStartTime', Date.now());
    genExam();
    setupEvents();

})();
