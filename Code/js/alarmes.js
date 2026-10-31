// ============================================
// ALARMES — painel, lista, disparo
// ============================================
const btnAlarme = document.getElementById('btnAlarme');
const painelAlarme = document.getElementById('painelAlarme');
const btnFecharPainel = document.getElementById('btnFecharPainel');
const listaAlarmes = document.getElementById('listaAlarmes');
const alarmeTitulo = document.getElementById('alarmeTitulo');
const alarmeData = document.getElementById('alarmeData');
const alarmeHora = document.getElementById('alarmeHora');
const alarmeSom = document.getElementById('alarmeSom');
const diasSemana = document.getElementById('diasSemana');
const btnGuardarAlarme = document.getElementById('btnGuardarAlarme');
const erroAlarme = document.getElementById('erroAlarme');

// Elementos do painel de alarme a tocar
const painelTocar = document.getElementById('painelTocar');
const btnPararAlarme = document.getElementById('btnPararAlarme');
const tituloAlarmeAtivo = document.getElementById('tituloAlarmeAtivo');
const textoAlarmeAtivo = document.getElementById('textoAlarmeAtivo');

const NOMES_DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

let alarmes = window.notaAPI.carregarAlarmes();
let diasSelecionados = [];

// --- Lista ---
function formatarAlarme(alarme) {
  let textoAlarme = '';
  if (alarme.dias && alarme.dias.length) {
    const nomes = alarme.dias.map((d) => NOMES_DIAS[d]).join(', ');
    textoAlarme = `${nomes} às ${alarme.hora}`;
  } else if (alarme.data) {
    const d = new Date(alarme.data + 'T' + alarme.hora);
    textoAlarme = d.toLocaleDateString('pt-PT') + ' às ' + alarme.hora;
  } else {
    textoAlarme = `Todos os dias às ${alarme.hora}`;
  }

  // Se tiver título, inclui na visualização da lista
  if (alarme.titulo && alarme.titulo.trim() !== '') {
    return `<strong>${alarme.titulo}</strong> — ${textoAlarme}`;
  }
  return textoAlarme;
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

// --- Abrir / fechar painel de gestão ---
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

// --- Adicionar alarme ---
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
    titulo: alarmeTitulo.value.trim(),
    hora: alarmeHora.value,
    dias: diasSelecionados.length ? [...diasSelecionados] : null,
    data: diasSelecionados.length ? null : alarmeData.value,
    som: alarmeSom.value
  };
  alarmes.push(novoAlarme);
  window.notaAPI.guardarAlarmes(alarmes);
  renderizarLista();

  // Limpar campos
  alarmeTitulo.value = '';
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
// DISPARAR E PARAR ALARMES
// ============================================
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

function tocarAlarme(alarme) {
  // Iniciar animação visual contínua
  document.body.classList.add('a-tocar');

  // Definir título e texto no painel de toque
  tituloAlarmeAtivo.textContent = alarme.titulo ? alarme.titulo : 'Alarme';
  const corpoNotificacao = texto.innerText.trim() || 'Tens um lembrete.';
  textoAlarmeAtivo.textContent = corpoNotificacao;

  // Mostrar painel de toque
  painelTocar.style.display = 'flex';

  // Notificação do Windows
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(`⏰ ${alarme.titulo || 'Lembrete'}`, { body: corpoNotificacao });
  }

  // Tocar o som em loop contínuo até ser parado manualmente
  try {
    const audioAlarme = document.getElementById('somAlarme');
    if (audioAlarme) {
      audioAlarme.src = alarme.som || 'sons/alarme1.mp3';
      audioAlarme.currentTime = 0;
      audioAlarme.loop = true;
      audioAlarme.play().catch(err => console.log("Erro ao reproduzir áudio:", err));
    }
  } catch (e) {
    console.log(e);
  }
}

// Botão para parar o alarme manualmente
btnPararAlarme.addEventListener('click', () => {
  document.body.classList.remove('a-tocar');
  painelTocar.style.display = 'none';

  try {
    const audioAlarme = document.getElementById('somAlarme');
    if (audioAlarme) {
      audioAlarme.pause();
      audioAlarme.currentTime = 0;
    }
  } catch (e) {
    console.log(e);
  }
});

// Verificação periódica dos alarmes
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
      aplicaHoje = true;
    }

    if (!aplicaHoje) return;

    const chave = alarme.id + '_' + dataAtual + '_' + horaAtual;
    if (jaTocaramHoje.has(chave)) return;

    jaTocaramHoje.add(chave);
    tocarAlarme(alarme);
  });
}

setInterval(verificarAlarmes, 15000);