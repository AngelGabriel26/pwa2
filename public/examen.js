// examen.js - genera 10 preguntas de coordenadas con 4 opciones
(function(){
  const quizEl = document.getElementById('quiz');
  const submitBtn = document.getElementById('submitExam');
  const resultEl = document.getElementById('examResult');

  function rand(range=6){ return Math.floor(Math.random()*(range*2+1)) - range; }

  function makeQ(){
    const correct = {x: rand(8), y: rand(8)};
    // generate distractors
    const d1 = {x: correct.x + (Math.random()>.5?1:-1), y: correct.y};
    const d2 = {x: correct.x, y: correct.y + (Math.random()>.5?1:-1)};
    const d3 = {x: correct.x + (Math.random()>.5?2:-2), y: correct.y + (Math.random()>.5?2:-2)};
    const options = [correct, d1, d2, d3].sort(()=>Math.random()-0.5);
    return {correct, options, statement:`¿Cuál es la ubicación de (${correct.x}, ${correct.y})?`};
  }

  const qs = Array.from({length:10}, ()=>makeQ());

  function render(){
    quizEl.innerHTML = '';
    qs.forEach((q,i)=>{
      const div = document.createElement('div');
      div.style.marginBottom='12px';
      div.innerHTML = `<div style="font-weight:700">${i+1}. ${q.statement}</div>`;
      q.options.forEach((op,j)=>{
        const id = `q${i}_opt${j}`;
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.style.margin = '6px 6px 6px 0';
        btn.innerText = `(${op.x}, ${op.y})`;
        btn.addEventListener('click', ()=>{
          // mark selection
          div.querySelectorAll('button').forEach(b=>b.style.outline='none');
          btn.style.outline = '4px solid rgba(106,13,75,0.16)';
          q.selected = op;
        });
        div.appendChild(btn);
      });
      quizEl.appendChild(div);
    });
  }

  function grade(){
    let corrects = 0;
    qs.forEach(q=>{
      if (q.selected && q.selected.x === q.correct.x && q.selected.y === q.correct.y) corrects++;
    });
    const pct = Math.round((corrects / qs.length) * 100);
    resultEl.textContent = `Resultado: ${corrects} / ${qs.length} — Puntaje: ${pct}%`;
    // Save to localStorage
    const record = { date: Date.now(), corrects, total: qs.length, pct };
    localStorage.setItem('candy_exam_last', JSON.stringify(record));
    // show notification via service worker if permission
    if (Notification && Notification.permission === 'granted' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(swReg => {
        swReg.showNotification('Examen completado', { body: `Obtuviste ${pct}%` });
      });
    }
  }

  submitBtn.addEventListener('click', ()=> {
    grade();
    if (navigator.vibrate) navigator.vibrate([80,30,80]);
  });

  render();
})();
