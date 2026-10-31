// ============================================
// ALARMES — painel, lista, disparo
// ============================================
const btnAlarme = document.getElementById('btnAlarme');
const painelAlarme = document.getElementById('painelAlarme');
const btnFecharPainel = document.getElementById('btnFecharPainel');
const listaAlarmes = document.getElementById('listaAlarmes');
const alarmeData = document.getElementById('alarmeData');
const alarmeHora = document.getElementById('alarmeHora');
const diasSemana = document.getElementById('diasSemana');
const btnGuardarAlarme = document.getElementById('btnGuardarAlarme');
const erroAlarme = document.getElementById('erroAlarme');
const NOMES_DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

let alarmes = window.notaAPI.carregarAlarmes();
let diasSelecionados = [];

// --- Lista ---
function formatarAlarme(alarme) {
  if (alarme.dias && alarme.dias.length) {
    const nomes = alarme.dias.map((d) => NOMES_DIAS[d]).join(', ');
    return `${nomes} às ${alarme.hora}`;
  }
  if (alarme.data) {
    const d = new Date(alarme.data + 'T' + alarme.hora);
    return d.toLocaleDateString('pt-PT') + ' às ' + alarme.hora;
  }
  return `Todos os dias às ${alarme.hora}`;
}

function renderizarLista() {
  listaAlarmes.innerHTML = '';
  if (alarmes.length === 0) {
    listaAlarmes.innerHTML = '<div style="color:#999;">Sem alarmes guardados.</div>';
    return;
  }
  alarmes.forEach((alarme) => {
    const item = document.createElement('div');
    item.className = 'item-alarme';
    item.innerHTML = `
      <span>${formatarAlarme(alarme)}</span>
      <button data-id="${alarme.id}">Remover</button>
    `;
    listaAlarmes.appendChild(item);
  });
}
renderizarLista();

// --- Abrir / fechar painel ---
btnAlarme.addEventListener('click', () => {
  painelAlarme.style.display = 'flex';
});

btnFecharPainel.addEventListener('click', () => {
  painelAlarme.style.display = 'none';
});

// --- Dias da semana ---
diasSemana.querySelectorAll('button').forEach((btn) => {
  btn.addEventListener('click', () => {
    const dia = parseInt(btn.dataset.dia, 10);
    if (diasSelecionados.includes(dia)) {
      diasSelecionados = diasSelecionados.filter((d) => d !== dia);
      btn.classList.remove('ativo');
    } else {
      diasSelecionados.push(dia);
      btn.classList.add('ativo');
    }
  });
});

// --- Adicionar alarme (com validação) ---
function mostrarErroAlarme(mensagem) {
  erroAlarme.textContent = mensagem;
  erroAlarme.style.display = 'block';
  setTimeout(() => {
    erroAlarme.style.display = 'none';
  }, 3000);
}

btnGuardarAlarme.addEventListener('click', () => {
  if (!alarmeHora.value) {
    mostrarErroAlarme('Escolhe uma hora para o alarme.');
    return;
  }

  if (diasSelecionados.length === 0 && !alarmeData.value) {
    mostrarErroAlarme('Escolhe uma data ou pelo menos um dia da semana.');
    return;
  }

  const novoAlarme = {
    id: Date.now(),
    hora: alarmeHora.value,
    dias: diasSelecionados.length ? [...diasSelecionados] : null,
    data: diasSelecionados.length ? null : alarmeData.value
  };
  alarmes.push(novoAlarme);
  window.notaAPI.guardarAlarmes(alarmes);
  renderizarLista();

  diasSelecionados = [];
  diasSemana.querySelectorAll('button').forEach((b) => b.classList.remove('ativo'));
  seletorData.clear();
});

// --- Remover alarme ---
listaAlarmes.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    const id = parseInt(e.target.dataset.id, 10);
    alarmes = alarmes.filter((a) => a.id !== id);
    window.notaAPI.guardarAlarmes(alarmes);
    renderizarLista();
  }
});

// --- Seletores de data e hora ---
const seletorData = flatpickr('#alarmeData', {
  dateFormat: 'Y-m-d'
});

flatpickr('#alarmeHora', {
  enableTime: true,
  noCalendar: true,
  dateFormat: 'H:i',
  time_24hr: true
});

// ============================================
// DISPARAR ALARMES
// ============================================
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

function tocarAlarme(alarme) {
  // Pulso visual
  document.body.classList.add('a-tocar');
  setTimeout(() => document.body.classList.remove('a-tocar'), 2800);

  // Notificação do Windows
  const corpoNotificacao = texto.innerText.trim() || 'Tens um lembrete.';
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('⏰ Lembrete', { body: corpoNotificacao });
  }

  // Beep
  try {
    const ctxAudio = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctxAudio.createOscillator();
    const gain = ctxAudio.createGain();
    osc.connect(gain);
    gain.connect(ctxAudio.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctxAudio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctxAudio.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctxAudio.currentTime + 0.6);
    osc.start();
    osc.stop(ctxAudio.currentTime + 0.65);
  } catch (e) {}
}

// Verificação periódica (fora da função tocarAlarme, a correr sempre)
const jaTocaramHoje = new Set();

function verificarAlarmes() {
  const agora = new Date();
  const horaAtual = agora.toTimeString().slice(0, 5);
  const diaSemanaAtual = agora.getDay();
  const dataAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;

  alarmes.forEach((alarme) => {
    if (alarme.hora !== horaAtual) return;

    let aplicaHoje;
    if (alarme.dias && alarme.dias.length) {
      aplicaHoje = alarme.dias.includes(diaSemanaAtual);
    } else if (alarme.data) {
      aplicaHoje = alarme.data === dataAtual;
    } else {
      aplicaHoje = true; // sem dias nem data = todos os dias
    }

    if (!aplicaHoje) return;

    const chave = alarme.id + '_' + dataAtual + '_' + horaAtual;
    if (jaTocaramHoje.has(chave)) return;

    jaTocaramHoje.add(chave);
    tocarAlarme(alarme);
  });
}

setInterval(verificarAlarmes, 15000);