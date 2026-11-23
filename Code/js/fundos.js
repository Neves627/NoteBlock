// ============================================
// FUNDOS DA NOTA — escolher o fundo com miniaturas
// Carregar DEPOIS do nota-janela.js: usa "notaAtual" e "guardarNota".
// ============================================

// Cada fundo tem um id (é este que fica guardado na nota), um nome (aparece
// ao passar o rato na miniatura) e o valor CSS do fundo.
// O MESMO valor serve para a nota e para a miniatura.
const FUNDOS = [
  { id: 'amarelo',    nome: 'Amarelo',    css: '#fff2ba' },
  { id: 'rosa',       nome: 'Rosa',       css: '#ffd6e0' },
  { id: 'azul',       nome: 'Azul',       css: '#cfe8ff' },
  { id: 'verde',      nome: 'Verde',      css: '#d4f5d0' },
  { id: 'lilas',      nome: 'Lilás',      css: '#e4d9ff' },
  { id: 'pastel',     nome: 'Pastel',     css: 'linear-gradient(135deg, #ffd6e0, #cfe8ff)' },
  { id: 'por-do-sol', nome: 'Pôr do sol', css: 'linear-gradient(160deg, #ffe29f, #ffa99f 55%, #ff719a)' },
  { id: 'pautado',    nome: 'Pautado',    css: 'repeating-linear-gradient(#fffdf2 0 23px, #cfe3f5 23px 24px)' }

  // Para usar uma imagem tua, põe o ficheiro em images/fundos/ e acrescenta:
  // { id: 'madeira', nome: 'Madeira', css: "url('images/fundos/madeira.jpg') center / cover no-repeat" }
];

// Fundo da nota atual (se a nota ainda não tem fundo, usa o primeiro da lista).
// O guardarNota() do nota-janela.js grava este valor em notaAtual.fundo.
let fundoAtualId = notaAtual.fundo || FUNDOS[0].id;

function aplicarFundo(id) {
  const fundo = FUNDOS.find((f) => f.id === id) || FUNDOS[0];
  fundoAtualId = fundo.id;
  document.body.style.background = fundo.css;
  document.body.style.backgroundAttachment = 'fixed';
}

// --- Painel com as miniaturas ---
const btnFundo = document.getElementById('btnFundo');
const painelFundos = document.createElement('div');
painelFundos.className = 'painel-fundos';
painelFundos.style.display = 'none';
document.body.appendChild(painelFundos);

function marcarFundoAtivo() {
  painelFundos.querySelectorAll('.fundo-miniatura').forEach((m) => {
    m.classList.toggle('ativo', m.dataset.id === fundoAtualId);
  });
}

FUNDOS.forEach((fundo) => {
  const miniatura = document.createElement('button');
  miniatura.className = 'fundo-miniatura';
  miniatura.title = fundo.nome;
  miniatura.dataset.id = fundo.id;
  miniatura.style.background = fundo.css;

  miniatura.addEventListener('click', () => {
    aplicarFundo(fundo.id);
    marcarFundoAtivo();
    guardarNota();
  });

  painelFundos.appendChild(miniatura);
});

// Abrir / fechar o painel
btnFundo.addEventListener('click', (e) => {
  e.stopPropagation();
  painelFundos.style.display = painelFundos.style.display === 'none' ? 'grid' : 'none';
});

// Fechar ao clicar fora do painel
document.addEventListener('click', (e) => {
  if (!painelFundos.contains(e.target)) {
    painelFundos.style.display = 'none';
  }
});

// Aplicar o fundo guardado ao abrir a nota
aplicarFundo(fundoAtualId);
marcarFundoAtivo();