// ============================================
// NOTA — texto, placeholder, fechar
// (carrega primeiro: define "texto", usado nos outros ficheiros)
// ============================================
const texto = document.getElementById('texto');

function atualizarPlaceholder() {
  if (texto.innerHTML.trim() === '') {
    texto.classList.add('empty');
  } else {
    texto.classList.remove('empty');
  }
}

// Carregar o que estava guardado
texto.innerHTML = window.notaAPI.carregar();
atualizarPlaceholder();

// Guardar sempre que o conteúdo muda
texto.addEventListener('input', () => {
  atualizarPlaceholder();
  window.notaAPI.guardar(texto.innerHTML);
});

// Botão fechar
const btnFechar = document.getElementById('btnFechar');
btnFechar.addEventListener('click', () => {
  window.notaAPI.fecharJanela();
});