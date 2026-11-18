// ============================================
// LÓGICA DA JANELA DE NOTA INDIVIDUAL
// ============================================

const urlParams = new URLSearchParams(window.location.search);
const notaId = parseInt(urlParams.get('id'), 10);

let notas = window.notaAPI.carregarNotas();
let notaAtual = notas.find(n => n.id === notaId);

if (!notaAtual) {
  alert('Nota não encontrada!');
  window.close();
}

const btnFechar = document.getElementById('btnFechar');
const tituloNotaInput = document.getElementById('tituloNotaInput');
const texto = document.getElementById('texto');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Carregar dados iniciais da nota
tituloNotaInput.value = notaAtual.titulo || '';
texto.innerHTML = notaAtual.conteudo || '';

btnFechar.addEventListener('click', () => {
  guardarNota();
  window.notaAPI.fecharJanela();
});

// Função para guardar diretamente no electron-store
function guardarNota() {
  notaAtual.titulo = tituloNotaInput.value;
  notaAtual.conteudo = texto.innerHTML;
  notaAtual.desenho = canvas.toDataURL();
  
  let listaAtualizada = window.notaAPI.carregarNotas();
  const index = listaAtualizada.findIndex(n => n.id === notaId);
  if (index !== -1) {
    listaAtualizada[index] = notaAtual;
    window.notaAPI.guardarNotas(listaAtualizada);
  }
}

// Auto-guardar ao escrever
texto.addEventListener('input', () => {
  atualizarPlaceholder();
  guardarNota();
});

tituloNotaInput.addEventListener('input', () => {
  guardarNota();
});

function atualizarPlaceholder() {
  if (texto.innerHTML.trim() === '') {
    texto.classList.add('empty');
  } else {
    texto.classList.remove('empty');
  }
}
atualizarPlaceholder();

// ============================================
// DESENHO (Canvas Adaptativo)
// ============================================
function ajustarTamanhoCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 40;

  if (notaAtual.desenho) {
    const imgDesenho = new Image();
    imgDesenho.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgDesenho, 0, 0);
    };
    imgDesenho.src = notaAtual.desenho;
  }
}

ajustarTamanhoCanvas();

let aDesenhar = false;

document.getElementById('btnDesenhar').addEventListener('click', () => {
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  document.body.classList.toggle('desenhando');
});

document.getElementById('btnBorracha').addEventListener('click', () => {
  document.body.classList.add('desenhando');
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineWidth = 12;
});

document.getElementById('btnLimpar').addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  guardarNota();
});

canvas.addEventListener('mousedown', (e) => {
  aDesenhar = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener('mousemove', (e) => {
  if (!aDesenhar) return;
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
});

canvas.addEventListener('mouseup', () => {
  if (aDesenhar) {
    aDesenhar = false;
    guardarNota();
  }
});

canvas.addEventListener('mouseleave', () => {
  if (aDesenhar) {
    aDesenhar = false;
    guardarNota();
  }
});

window.addEventListener('resize', () => {
  ajustarTamanhoCanvas();
});

// ============================================
// IMAGENS (Colar, Arrastar, Redimensionar, Apagar)
// ============================================
function inserirImagemRedimensionavel(src, styleProps = {}) {
  const wrapper = document.createElement('span');
  wrapper.className = 'imagem-wrapper';
  wrapper.contentEditable = false;
  wrapper.style.width = styleProps.width || '150px';
  wrapper.style.height = styleProps.height || '150px';
  wrapper.style.left = styleProps.left || '10px';
  wrapper.style.top = styleProps.top || '50px';

  const img = document.createElement('img');
  img.src = src;

  const btnApagar = document.createElement('button');
  btnApagar.className = 'btn-apagar-imagem';
  btnApagar.textContent = '✕';

  wrapper.appendChild(img);
  wrapper.appendChild(btnApagar);
  texto.appendChild(wrapper);

  guardarNota();
}

texto.addEventListener('paste', (e) => {
  const items = e.clipboardData.items;
  for (const item of items) {
    if (item.type.indexOf('image') === 0) {
      e.preventDefault();
      const file = item.getAsFile();
      const reader = new FileReader();
      reader.onload = (evento) => {
        inserirImagemRedimensionavel(evento.target.result);
      };
      reader.readAsDataURL(file);
      return;
    }
  }
});

texto.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-apagar-imagem')) {
    e.target.closest('.imagem-wrapper').remove();
    guardarNota();
  }
});

interact('.imagem-wrapper')
  .draggable({
    ignoreFrom: '.btn-apagar-imagem',
    listeners: {
      move(event) {
        const target = event.target;
        const left = (parseFloat(target.style.left) || 0) + event.dx;
        const top = (parseFloat(target.style.top) || 0) + event.dy;
        target.style.left = left + 'px';
        target.style.top = top + 'px';
      },
      end() {
        guardarNota();
      }
    }
  })
  .resizable({
    edges: { left: false, top: false, right: true, bottom: true },
    margin: 8,
    listeners: {
      move(event) {
        Object.assign(event.target.style, {
          width: `${event.rect.width}px`,
          height: `${event.rect.height}px`
        });
      },
      end() {
        guardarNota();
      }
    }
  });

// ============================================
// GESTÃO DE ALARMES DA NOTA
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
let diasSelecionados = [];

btnAlarme.addEventListener('click', () => { painelAlarme.style.display = 'flex'; });
btnFecharPainel.addEventListener('click', () => { painelAlarme.style.display = 'none'; });

diasSemana.querySelectorAll('button').forEach((btn) => {
  btn.addEventListener('click', () => {
    const dia = parseInt(btn.dataset.dia, 10);
    if (diasSelecionados.includes(dia)) {
      diasSelecionados = diasSelecionados.filter(d => d !== dia);
      btn.classList.remove('ativo');
    } else {
      diasSelecionados.push(dia);
      btn.classList.add('ativo');
    }
  });
});

function renderizarListaAlarmes() {
  if (!notaAtual.alarmes) notaAtual.alarmes = [];
  listaAlarmes.innerHTML = '';
  
  if (notaAtual.alarmes.length === 0) {
    listaAlarmes.innerHTML = '<div style="color:#999;">Sem alarmes nesta nota.</div>';
    return;
  }

  notaAtual.alarmes.forEach((alarme) => {
    const item = document.createElement('div');
    item.className = 'item-alarme';
    let txt = alarme.hora;
    if (alarme.titulo) txt = `${alarme.titulo} (${txt})`;
    item.innerHTML = `<span>${txt}</span><button data-id="${alarme.id}">Remover</button>`;
    listaAlarmes.appendChild(item);
  });
}
renderizarListaAlarmes();

btnGuardarAlarme.addEventListener('click', () => {
  if (!alarmeHora.value) {
    erroAlarme.textContent = 'Escolhe uma hora.';
    erroAlarme.style.display = 'block';
    return;
  }
  if (!notaAtual.alarmes) notaAtual.alarmes = [];

  notaAtual.alarmes.push({
    id: Date.now(),
    titulo: alarmeTitulo.value.trim(),
    hora: alarmeHora.value,
    dias: diasSelecionados.length ? [...diasSelecionados] : null,
    data: diasSelecionados.length ? null : alarmeData.value,
    som: alarmeSom.value
  });
  guardarNota();
  renderizarListaAlarmes();
  alarmeTitulo.value = '';
  diasSelecionados = [];
  diasSemana.querySelectorAll('button').forEach(b => b.classList.remove('ativo'));
});

listaAlarmes.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    const id = parseInt(e.target.dataset.id, 10);
    notaAtual.alarmes = notaAtual.alarmes.filter(a => a.id !== id);
    guardarNota();
    renderizarListaAlarmes();
  }
});

flatpickr('#alarmeData', { dateFormat: 'Y-m-d' });
flatpickr('#alarmeHora', { enableTime: true, noCalendar: true, dateFormat: 'H:i', time_24hr: true });

// ============================================
// DISPARAR ALARME NA JANELA
// ============================================
const painelTocar = document.getElementById('painelTocar');
const btnPararAlarme = document.getElementById('btnPararAlarme');
const tituloAlarmeAtivo = document.getElementById('tituloAlarmeAtivo');
const textoAlarmeAtivo = document.getElementById('textoAlarmeAtivo');

function tocarAlarme(alarme) {
  document.body.classList.add('a-tocar');
  tituloAlarmeAtivo.textContent = alarme.titulo ? alarme.titulo : (notaAtual.titulo || 'Alarme');
  textoAlarmeAtivo.textContent = notaAtual.conteudo.replace(/<[^>]*>?/gm, '').trim() || 'Tens um lembrete.';
  painelTocar.style.display = 'flex';

  try {
    const audioAlarme = document.getElementById('somAlarme');
    if (audioAlarme) {
      audioAlarme.src = alarme.som || 'sons/alarme1.mp3';
      audioAlarme.currentTime = 0;
      audioAlarme.loop = true;
      audioAlarme.play().catch(e => {});
    }
  } catch (e) {}
}

btnPararAlarme.addEventListener('click', () => {
  document.body.classList.remove('a-tocar');
  painelTocar.style.display = 'none';
  try {
    const audioAlarme = document.getElementById('somAlarme');
    if (audioAlarme) { audioAlarme.pause(); audioAlarme.currentTime = 0; }
  } catch (e) {}
});

const jaTocaramHoje = new Set();
function verificarAlarmesNota() {
  if (notaAtual.oculta || !notaAtual.alarmes) return;
  
  const agora = new Date();
  const horaAtual = agora.toTimeString().slice(0, 5);
  const diaSemanaAtual = agora.getDay();
  const dataAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;

  notaAtual.alarmes.forEach((alarme) => {
    if (alarme.hora !== horaAtual) return;
    let aplicaHoje = false;
    if (alarme.dias && alarme.dias.length) aplicaHoje = alarme.dias.includes(diaSemanaAtual);
    else if (alarme.data) aplicaHoje = (alarme.data === dataAtual);
    else aplicaHoje = true;

    if (!aplicaHoje) return;

    const chave = alarme.id + '_' + dataAtual + '_' + horaAtual;
    if (jaTocaramHoje.has(chave)) return;

    jaTocaramHoje.add(chave);
    tocarAlarme(alarme);
  });
}
setInterval(verificarAlarmesNota, 15000);