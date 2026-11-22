// ============================================
// CONTROLLER DE NOTAS — menu.js
// ============================================
const btnFechar = document.getElementById('btnFechar');
const btnCriarNota = document.getElementById('btnCriarNota');
const inputNovoNome = document.getElementById('inputNovoNome');
const listaNotasContainer = document.getElementById('listaNotasContainer');
const btnTema = document.getElementById('btnTema');
const iconeTema = btnTema ? btnTema.querySelector('i') : null;

let notas = window.notaAPI.carregarNotas();

// ============================================
// GESTÃO DE TEMA (SOL / LUA) E IMAGENS DE FUNDO
// ============================================
const temaAtual = localStorage.getItem('theme') || 'light';
if (temaAtual === 'dark') {
  document.body.classList.add('dark-theme');
  if (iconeTema) iconeTema.className = 'mdi mdi-weather-night';
} else {
  if (iconeTema) iconeTema.className = 'mdi mdi-white-balance-sunny';
}

if (btnTema) {
  btnTema.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    
    if (document.body.classList.contains('dark-theme')) {
      if (iconeTema) iconeTema.className = 'mdi mdi-weather-night';
      localStorage.setItem('theme', 'dark');
    } else {
      if (iconeTema) iconeTema.className = 'mdi mdi-white-balance-sunny';
      localStorage.setItem('theme', 'light');
    }
  });
}

// Fechar a janela do menu
btnFechar.addEventListener('click', () => {
  window.notaAPI.fecharJanela();
});

// Criar nova nota usando o valor do input
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


// Renderizar a lista de notas no painel de controlo
function renderizarMenu() {
  notas = window.notaAPI.carregarNotas(); 
  listaNotasContainer.innerHTML = ''; 

  if (notas.length === 0) {
    listaNotasContainer.innerHTML = '<div style="color:#666; text-align:center; margin-top:20px; font-size:12px;">Sem notas criadas.</div>'; 
    return; 
  }

  notas.forEach((n) => { 
    const item = document.createElement('div'); 
    item.className = 'item-menu-nota group flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-[#1b182b] border border-slate-200/80 dark:border-purple-500/15 hover:border-accent/60 dark:hover:border-accentLight/50 shadow-2xs transition cursor-pointer';

    const tituloSpan = document.createElement('span'); 
    tituloSpan.textContent = n.titulo || 'Nota sem título'; 
    tituloSpan.className = 'text-xs font-medium text-slate-700 dark:text-slate-200 group-hover:text-accent dark:group-hover:text-accentLight truncate flex-1 mr-2';

    // Ao clicar no título ou no cartão, abre a janela dedicada a esta nota
    item.addEventListener('click', () => { 
      window.notaAPI.abrirNotaJanela(n.id); 
    });

    const divBotoes = document.createElement('div'); //[cite: 17]
    divBotoes.className = 'botoes-item-nota flex items-center gap-1';

    // Botão Apagar com ícone moderno (Material Design Icons / delete-outline)
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

        notas = notas.filter(nota => nota.id !== n.id); 
        window.notaAPI.guardarNotas(notas);
        renderizarMenu(); 
      }
    });

    divBotoes.appendChild(btnApagar); 

    item.appendChild(tituloSpan); 
    item.appendChild(divBotoes); 

    listaNotasContainer.appendChild(item); 
  });

  const btnMinimizar = document.getElementById('btnMinimizar'); 

  if (btnMinimizar) { 
    btnMinimizar.addEventListener('click', () => { 
      window.notaAPI.minimizarJanela(); 
    });
  }
}

// Inicializar o menu
renderizarMenu();