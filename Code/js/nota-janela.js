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
const btnPin = document.getElementById('btnPin');
const tituloNotaInput = document.getElementById('tituloNotaInput');
const texto = document.getElementById('texto');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let notaAfixada = Boolean(notaAtual.afixada);
if (!Array.isArray(notaAtual.checklist)) {
  notaAtual.checklist = [];
}

function atualizarEstadoPin() {
  if (!btnPin) return;
  btnPin.classList.toggle('ativo', notaAfixada);
  btnPin.title = notaAfixada ? 'Desafixar do topo' : 'Afixar no topo';
  btnPin.setAttribute('aria-pressed', String(notaAfixada));
}

if (window.notaAPI && typeof window.notaAPI.definirSempreNoTopoNota === 'function') {
  window.notaAPI.definirSempreNoTopoNota(notaId, notaAfixada);
}
atualizarEstadoPin();

if (btnPin) {
  btnPin.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    notaAfixada = !notaAfixada;
    notaAtual.afixada = notaAfixada;
    atualizarEstadoPin();

    if (window.notaAPI && typeof window.notaAPI.definirSempreNoTopoNota === 'function') {
      window.notaAPI.definirSempreNoTopoNota(notaId, notaAfixada);
    }

    guardarNota();
  });
}

// Fecho da nota
if (btnFechar) {
  btnFechar.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (typeof guardarNota === 'function') {
        guardarNota();
      }
    } catch (err) {
      console.error('Erro ao guardar nota ao fechar:', err);
    }

    if (window.notaAPI && typeof window.notaAPI.fecharJanela === 'function') {
      window.notaAPI.fecharJanela();
    } else {
      window.close();
    }
  });
}

// Carregar dados iniciais da nota
tituloNotaInput.value = notaAtual.titulo || '';
texto.innerHTML = notaAtual.conteudo || '';

// Função para guardar diretamente no electron-store
function guardarNota() {
  notaAtual.titulo = tituloNotaInput.value;
  notaAtual.conteudo = texto.innerHTML;
  notaAtual.desenho = canvas.toDataURL();
  notaAtual.afixada = notaAfixada;
  notaAtual.checklist = Array.isArray(notaAtual.checklist) ? notaAtual.checklist : [];
  if (typeof fundoAtualId !== 'undefined') {
    notaAtual.fundo = fundoAtualId;
  }

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
const btnDiasUteis = document.getElementById('btnDiasUteis');
const btnGuardarAlarme = document.getElementById('btnGuardarAlarme');
const erroAlarme = document.getElementById('erroAlarme');

const NOMES_DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
let diasSelecionados = [];

const seletorData = flatpickr('#alarmeData', {
  dateFormat: 'Y-m-d',
  onChange: () => {
    if (alarmeData.value) {
      diasSelecionados = [];
      diasSemana.querySelectorAll('button').forEach(b => b.classList.remove('ativo'));
    }
  }
});

flatpickr('#alarmeHora', {
  enableTime: true,
  noCalendar: true,
  dateFormat: 'H:i',
  time_24hr: true
});

btnAlarme.addEventListener('click', () => {
  painelAlarme.style.display = 'flex';
});

btnFecharPainel.addEventListener('click', () => {
  painelAlarme.style.display = 'none';
});

painelAlarme.addEventListener('click', (e) => {
  if (e.target === painelAlarme) {
    painelAlarme.style.display = 'none';
  }
});

if (btnDiasUteis) {
  btnDiasUteis.addEventListener('click', () => {
    const diasUteis = [1, 2, 3, 4, 5];
    const jaEstaoTodos =
      diasUteis.every((d) => diasSelecionados.includes(d)) &&
      diasSelecionados.length === 5;

    diasSelecionados = jaEstaoTodos ? [] : diasUteis;

    diasSemana.querySelectorAll('button').forEach((btn) => {
      const dia = parseInt(btn.dataset.dia, 10);
      btn.classList.toggle('ativo', diasSelecionados.includes(dia));
    });

    if (diasSelecionados.length > 0) {
      seletorData.clear();
    }
  });
}

diasSemana.querySelectorAll('button').forEach((btn) => {
  btn.addEventListener('click', () => {
    const dia = parseInt(btn.dataset.dia, 10);
    if (diasSelecionados.includes(dia)) {
      diasSelecionados = diasSelecionados.filter(d => d !== dia);
      btn.classList.remove('ativo');
    } else {
      diasSelecionados.push(dia);
      btn.classList.add('ativo');
      seletorData.clear();
    }
  });
});

function descreverRepeticaoAlarme(alarme) {
  if (alarme.dias && alarme.dias.length) {
    const ordenados = [...alarme.dias].sort((a, b) => a - b);
    if (ordenados.length === 7) return 'Todos os dias';
    if (
      ordenados.length === 5 &&
      [1, 2, 3, 4, 5].every((d) => ordenados.includes(d))
    ) {
      return 'Dias úteis (Seg–Sex)';
    }
    return ordenados.map((d) => NOMES_DIAS_CURTOS[d]).join(', ');
  }
  if (alarme.data) {
    const [ano, mes, dia] = alarme.data.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  return 'Todos os dias';
}

function renderizarListaAlarmes() {
  if (!notaAtual.alarmes) notaAtual.alarmes = [];
  listaAlarmes.innerHTML = '';

  if (notaAtual.alarmes.length === 0) {
    listaAlarmes.innerHTML = '<div class="alarme-vazio">Sem alarmes nesta nota. Cria um abaixo.</div>';
    return;
  }

  notaAtual.alarmes.forEach((alarme) => {
    const item = document.createElement('div');
    item.className = 'alarme-cartao';

    const repeticao = descreverRepeticaoAlarme(alarme);
    const titulo = alarme.titulo && alarme.titulo.trim() ? alarme.titulo.trim() : 'Lembrete da nota';

    item.innerHTML = `
      <div class="alarme-cartao-hora">${alarme.hora}</div>
      <div class="alarme-cartao-info">
        <div class="alarme-cartao-titulo">${titulo}</div>
        <div class="alarme-cartao-meta">${repeticao}</div>
      </div>
      <button type="button" class="alarme-btn-remover" data-id="${alarme.id}" title="Remover alarme">🗑</button>
    `;
    listaAlarmes.appendChild(item);
  });
}
renderizarListaAlarmes();

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

  if (!notaAtual.alarmes) notaAtual.alarmes = [];

  notaAtual.alarmes.push({
    id: Date.now(),
    titulo: alarmeTitulo.value.trim(),
    hora: alarmeHora.value,
    dias: diasSelecionados.length ? [...diasSelecionados].sort((a, b) => a - b) : null,
    data: diasSelecionados.length ? null : alarmeData.value,
    som: alarmeSom.value
  });

  guardarNota();
  renderizarListaAlarmes();

  alarmeTitulo.value = '';
  diasSelecionados = [];
  diasSemana.querySelectorAll('button').forEach(b => b.classList.remove('ativo'));
  seletorData.clear();
  erroAlarme.style.display = 'none';
});

listaAlarmes.addEventListener('click', (e) => {
  const btnRemover = e.target.closest('.alarme-btn-remover');
  if (btnRemover) {
    const id = parseInt(btnRemover.dataset.id, 10);
    notaAtual.alarmes = notaAtual.alarmes.filter(a => a.id !== id);
    guardarNota();
    renderizarListaAlarmes();
  }
});

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

// ============================================
// PAINEL LATERAL DE CHECKLIST
// ============================================
const btnGavetaChecklist = document.getElementById('btnGavetaChecklist');
const painelChecklist = document.getElementById('painelChecklist');
const btnFecharChecklist = document.getElementById('btnFecharChecklist');
const inputNovaTarefa = document.getElementById('inputNovaTarefa');
const btnAdicionarTarefa = document.getElementById('btnAdicionarTarefa');
const listaChecklist = document.getElementById('listaChecklist');
const resumoChecklist = document.getElementById('resumoChecklist');
const contadorChecklist = document.getElementById('contadorChecklist');

function atualizarResumoChecklist() {
  const total = notaAtual.checklist.length;
  const concluidas = notaAtual.checklist.filter((item) => item.feita).length;
  if (resumoChecklist) resumoChecklist.textContent = `${concluidas} de ${total} concluídas`;
  if (contadorChecklist) contadorChecklist.textContent = String(total - concluidas);
}

function renderizarChecklist() {
  if (!listaChecklist) return;
  listaChecklist.innerHTML = '';

  if (notaAtual.checklist.length === 0) {
    listaChecklist.innerHTML = '<small style="text-align:center;opacity:0.7;padding:12px 0;">Sem tarefas nesta nota.</small>';
    atualizarResumoChecklist();
    return;
  }

  notaAtual.checklist.forEach((item) => {
    const linha = document.createElement('div');
    linha.className = `item-checklist${item.feita ? ' concluida' : ''}`;

    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = Boolean(item.feita);
    checkbox.addEventListener('change', () => {
      item.feita = checkbox.checked;
      linha.classList.toggle('concluida', item.feita);
      atualizarResumoChecklist();
      guardarNota();
    });

    const span = document.createElement('span');
    span.textContent = item.texto;

    label.appendChild(checkbox);
    label.appendChild(span);

    const btnRemover = document.createElement('button');
    btnRemover.type = 'button';
    btnRemover.className = 'outline secondary';
    btnRemover.style.cssText = 'padding:0.1rem 0.35rem;margin:0;width:auto;font-size:0.7rem;border:none;';
    btnRemover.textContent = '✕';
    btnRemover.addEventListener('click', () => {
      notaAtual.checklist = notaAtual.checklist.filter((t) => t.id !== item.id);
      renderizarChecklist();
      guardarNota();
    });

    linha.appendChild(label);
    linha.appendChild(btnRemover);
    listaChecklist.appendChild(linha);
  });

  atualizarResumoChecklist();
}

function adicionarTarefaChecklist() {
  if (!inputNovaTarefa) return;
  const textoTarefa = inputNovaTarefa.value.trim();
  if (!textoTarefa) return;

  notaAtual.checklist.push({ id: Date.now(), texto: textoTarefa, feita: false });
  inputNovaTarefa.value = '';
  renderizarChecklist();
  guardarNota();
  inputNovaTarefa.focus();
}

if (btnGavetaChecklist && painelChecklist) {
  btnGavetaChecklist.addEventListener('click', (e) => {
    e.stopPropagation();
    const vaiAbrir = !painelChecklist.classList.contains('aberta');
    painelChecklist.classList.toggle('aberta', vaiAbrir);
    painelChecklist.setAttribute('aria-hidden', String(!vaiAbrir));
    if (vaiAbrir && inputNovaTarefa) setTimeout(() => inputNovaTarefa.focus(), 50);
  });
}

if (btnFecharChecklist && painelChecklist) {
  btnFecharChecklist.addEventListener('click', () => {
    painelChecklist.classList.remove('aberta');
    painelChecklist.setAttribute('aria-hidden', 'true');
  });
}

if (btnAdicionarTarefa) btnAdicionarTarefa.addEventListener('click', adicionarTarefaChecklist);
if (inputNovaTarefa) {
  inputNovaTarefa.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      adicionarTarefaChecklist();
    }
  });
}

renderizarChecklist();
