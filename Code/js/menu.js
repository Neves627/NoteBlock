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
    item.className = 'item-menu-nota';
    // Estilo para alinhar título à esquerda e botão à direita
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.alignItems = 'center';
    
    const tituloSpan = document.createElement('span');
    tituloSpan.textContent = n.titulo || 'Nota sem título';
    tituloSpan.style.cursor = 'pointer';
    tituloSpan.style.flex = '1';
    tituloSpan.style.overflow = 'hidden';
    tituloSpan.style.textOverflow = 'ellipsis';
    tituloSpan.style.whiteSpace = 'nowrap';
    tituloSpan.style.marginRight = '8px';
    
    // Ao clicar no título, abre a janela dedicada a esta nota
    tituloSpan.addEventListener('click', () => {
      window.notaAPI.abrirNotaJanela(n.id);
    });

    const divBotoes = document.createElement('div');
    divBotoes.className = 'botoes-item-nota';
    divBotoes.style.display = 'flex';
    divBotoes.style.gap = '4px';

    // Botão Apagar com ícone moderno (Material Design Icons / delete-outline)
    const btnApagar = document.createElement('button');
    btnApagar.innerHTML = '<i class="mdi mdi-delete-outline"></i>';
    btnApagar.title = 'Apagar nota';
    btnApagar.addEventListener('click', () => {
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