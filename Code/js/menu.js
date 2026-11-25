// ============================================
// CONTROLLER DE NOTAS — menu.js
// ============================================
const btnFechar = document.getElementById('btnFechar');
const btnMinimizar = document.getElementById('btnMinimizar');
const btnCriarNota = document.getElementById('btnCriarNota');
const inputNovoNome = document.getElementById('inputNovoNome');
const listaNotasContainer = document.getElementById('listaNotasContainer');
const btnTema = document.getElementById('btnTema');
const iconeTema = btnTema ? btnTema.querySelector('i') : null;

let notas = window.notaAPI.carregarNotas();

// ============================================
// AMOSTRAS DE COR / FUNDO (iguais ao fundos.js)
// ============================================
const FUNDOS_MENU = {
  amarelo:    { nome: 'Amarelo',    css: '#fff2ba' },
  rosa:       { nome: 'Rosa',       css: '#ffd6e0' },
  azul:       { nome: 'Azul',       css: '#cfe8ff' },
  verde:      { nome: 'Verde',      css: '#d4f5d0' },
  lilas:      { nome: 'Lilás',      css: '#e4d9ff' },
  pastel:     { nome: 'Pastel',     css: 'linear-gradient(135deg, #ffd6e0, #cfe8ff)' },
  'por-do-sol': { nome: 'Pôr do sol', css: 'linear-gradient(160deg, #ffe29f, #ffa99f 55%, #ff719a)' },
  pautado:    { nome: 'Pautado',    css: 'repeating-linear-gradient(#fffdf2 0 6px, #cfe3f5 6px 8px)' }
};

function obterFundoNota(fundoId) {
  return FUNDOS_MENU[fundoId] || FUNDOS_MENU.amarelo;
}

function temAlarmesAtivos(nota) {
  return Array.isArray(nota.alarmes) && nota.alarmes.length > 0;
}

function focarInputNovoNome() {
  if (!inputNovoNome) return;
  inputNovoNome.disabled = false;
  inputNovoNome.readOnly = false;
  inputNovoNome.value = '';
  requestAnimationFrame(() => {
    inputNovoNome.focus();
  });
}

// ============================================
// TEMA (SOL / LUA)
// ============================================
function aplicarTema(tema) {
  const escuro = tema === 'dark';
  document.documentElement.classList.toggle('dark', escuro);
  document.documentElement.setAttribute('data-theme', escuro ? 'dark' : 'light');
  document.body.classList.toggle('dark-theme', escuro);
  if (iconeTema) {
    iconeTema.className = escuro ? 'mdi mdi-weather-night' : 'mdi mdi-white-balance-sunny';
  }
  localStorage.setItem('theme', tema);
}

aplicarTema(localStorage.getItem('theme') || 'light');

if (btnTema) {
  btnTema.addEventListener('click', () => {
    const escuro = document.documentElement.classList.contains('dark');
    aplicarTema(escuro ? 'light' : 'dark');
  });
}

// ============================================
// BOTÕES DA JANELA
// ============================================
btnFechar.addEventListener('click', () => {
  window.notaAPI.fecharJanela();
});

if (btnMinimizar) {
  btnMinimizar.addEventListener('click', () => {
    window.notaAPI.minimizarJanela();
  });
}

// ============================================
// CRIAR NOVA NOTA
// ============================================
btnCriarNota.addEventListener('click', () => {
  const nomeNota = inputNovoNome.value.trim();

  if (!nomeNota) {
    inputNovoNome.focus();
    return;
  }

  const nova = {
    id: Date.now(),
    titulo: nomeNota,
    conteudo: '',
    desenho: null,
    alarmes: [],
    fundo: 'amarelo',
    oculta: false
  };

  notas.push(nova);
  window.notaAPI.guardarNotas(notas);

  focarInputNovoNome();

  window.notaAPI.abrirNotaJanela(nova.id);
  renderizarMenu();
});

// ============================================
// LISTA DE NOTAS
// ============================================
function renderizarMenu() {
  notas = window.notaAPI.carregarNotas();
  listaNotasContainer.innerHTML = '';

  if (notas.length === 0) {
    listaNotasContainer.innerHTML = '<div style="color:#666; text-align:center; margin-top:20px; font-size:12px;">Sem notas criadas.</div>';
    return;
  }

  notas.forEach((n) => {
    const fundo = obterFundoNota(n.fundo);
    const temAlarme = temAlarmesAtivos(n);

    const item = document.createElement('div');
    item.className = 'item-menu-nota group flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white dark:bg-[#10222a] border border-slate-200/80 dark:border-teal-500/20 hover:border-accent/60 dark:hover:border-teal-400/60 shadow-2xs transition cursor-pointer';

    const indicadorCor = document.createElement('span');
    indicadorCor.className = 'indicador-cor-nota w-3.5 h-3.5 rounded-full shrink-0 border border-black/15 dark:border-white/20';
    indicadorCor.style.background = fundo.css;
    indicadorCor.title = `Fundo: ${fundo.nome}`;

    const tituloSpan = document.createElement('span');
    tituloSpan.textContent = n.titulo || 'Nota sem título';
    tituloSpan.className = 'text-xs font-medium text-slate-700 dark:text-slate-200 group-hover:text-accent dark:group-hover:text-teal-300 truncate flex-1';

    item.addEventListener('click', () => {
      window.notaAPI.abrirNotaJanela(n.id);
    });

    const divBotoes = document.createElement('div');
    divBotoes.className = 'botoes-item-nota flex items-center gap-1 shrink-0';

    if (temAlarme) {
      const badgeAlarme = document.createElement('span');
      badgeAlarme.className = 'badge-alarme-nota inline-flex items-center justify-center w-5 h-5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-300';
      badgeAlarme.title = `${n.alarmes.length} alarme(s) configurado(s)`;
      badgeAlarme.innerHTML = '<i class="mdi mdi-alarm text-xs"></i>';
      divBotoes.appendChild(badgeAlarme);
    }

    const btnApagar = document.createElement('button');
    btnApagar.className = 'btn btn-ghost btn-xs btn-square text-slate-400 hover:text-rose-500 hover:bg-rose-500/10';
    btnApagar.innerHTML = '<i class="mdi mdi-delete-outline text-base"></i>';
    btnApagar.title = 'Apagar nota';
    btnApagar.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Queres mesmo apagar a nota "${n.titulo}"?`)) {
        if (window.notaAPI.fecharNotaPorId) {
          window.notaAPI.fecharNotaPorId(n.id);
        }

        notas = notas.filter((nota) => nota.id !== n.id);
        window.notaAPI.guardarNotas(notas);
        renderizarMenu();
      }
    });

    divBotoes.appendChild(btnApagar);

    item.appendChild(indicadorCor);
    item.appendChild(tituloSpan);
    item.appendChild(divBotoes);

    listaNotasContainer.appendChild(item);
  });
}

// Inicializar o menu
renderizarMenu();