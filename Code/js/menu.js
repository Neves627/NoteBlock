// ============================================
// CONTROLLER DE NOTAS — menu.js
// ============================================
const btnFechar = document.getElementById('btnFechar');
const btnCriarNota = document.getElementById('btnCriarNota');
const inputNovoNome = document.getElementById('inputNovoNome');
const listaNotasContainer = document.getElementById('listaNotasContainer');

let notas = window.notaAPI.carregarNotas();

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
    
    const tituloSpan = document.createElement('span');
    tituloSpan.textContent = n.titulo || 'Nota sem título';
    tituloSpan.style.cursor = 'pointer';
    tituloSpan.style.flex = '1';
    
    // Ao clicar no título, abre a janela dedicada a esta nota
    tituloSpan.addEventListener('click', () => {
      window.notaAPI.abrirNotaJanela(n.id);
    });

    const divBotoes = document.createElement('div');
    divBotoes.className = 'botoes-item-nota';

    // Botão Esconder / Mostrar
    const btnEsconder = document.createElement('button');
    btnEsconder.textContent = n.oculta ? '👁️' : '👁️‍🗨️';
    btnEsconder.title = n.oculta ? 'Mostrar nota' : 'Esconder nota';
    btnEsconder.addEventListener('click', () => {
      n.oculta = !n.oculta;
      window.notaAPI.guardarNotas(notas);
      renderizarMenu();
    });

    // Botão Apagar (fecha também a janela se estiver aberta)
    const btnApagar = document.createElement('button');
    btnApagar.textContent = '🗑️';
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

    divBotoes.appendChild(btnEsconder);
    divBotoes.appendChild(btnApagar);

    item.appendChild(tituloSpan);
    item.appendChild(divBotoes);

    if (n.oculta) {
      item.classList.add('nota-oculta');
    }

    listaNotasContainer.appendChild(item);
  });
}

// Inicializar o menu
renderizarMenu();