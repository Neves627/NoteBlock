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
// TEMA (SOL / LUA)
// O Tailwind só ativa as classes "dark:" quando o <html> tem a classe "dark",
// por isso a classe é posta no <html> (e mantemos "dark-theme" no <body>
// para as regras que tenhas no estilos.css).
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
    alert('Por favor, escreve um nome para a nota.');
    return;
  }

  const nova = {
    id: Date.now(),
    titulo: nomeNota,
    conteudo: '',
    desenho: null,
    alarmes: [],
    oculta: false
  };

  notas.push(nova);
  window.notaAPI.guardarNotas(notas);

  // Limpar o input
  inputNovoNome.value = '';

  // Abrir imediatamente a janela da nova nota criada
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
    const item = document.createElement('div');
    item.className = 'item-menu-nota group flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-[#10222a] border border-slate-200/80 dark:border-teal-500/20 hover:border-accent/60 dark:hover:border-teal-400/60 shadow-2xs transition cursor-pointer';

    const tituloSpan = document.createElement('span');
    tituloSpan.textContent = n.titulo || 'Nota sem título';
    tituloSpan.className = 'text-xs font-medium text-slate-700 dark:text-slate-200 group-hover:text-accent dark:group-hover:text-teal-300 truncate flex-1 mr-2';

    // Ao clicar no cartão, abre a janela dedicada a esta nota
    item.addEventListener('click', () => {
      window.notaAPI.abrirNotaJanela(n.id);
    });

    const divBotoes = document.createElement('div');
    divBotoes.className = 'botoes-item-nota flex items-center gap-1';

    // Botão Apagar
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

    item.appendChild(tituloSpan);
    item.appendChild(divBotoes);

    listaNotasContainer.appendChild(item);
  });
}

// Inicializar o menu
renderizarMenu();