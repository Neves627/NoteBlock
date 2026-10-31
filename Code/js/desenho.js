// ============================================
// DESENHO — canvas, caneta, borracha, limpar
// ============================================
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let aDesenhar = false;
let modoBorracha = false;

// Tamanho inicial (só define o tamanho, não apaga nem redesenha nada)
function ajustarTamanhoCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 40;
}
ajustarTamanhoCanvas();

// Carregar o desenho guardado, uma única vez
const desenhoGuardado = window.notaAPI.carregarDesenho();
if (desenhoGuardado) {
  const imgDesenho = new Image();
  imgDesenho.onload = () => {
    ctx.drawImage(imgDesenho, 0, 0);
  };
  imgDesenho.src = desenhoGuardado;
}

// --- Botões ---
const btnDesenhar = document.getElementById('btnDesenhar');
btnDesenhar.addEventListener('click', () => {
  modoBorracha = false;
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  document.body.classList.toggle('desenhando');
});

const btnBorracha = document.getElementById('btnBorracha');
btnBorracha.addEventListener('click', () => {
  document.body.classList.add('desenhando');
  modoBorracha = true;
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineWidth = 12;
});

const btnLimpar = document.getElementById('btnLimpar');
btnLimpar.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  window.notaAPI.guardarDesenho(canvas.toDataURL());
});

// --- Desenhar com o rato ---
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
  aDesenhar = false;
  window.notaAPI.guardarDesenho(canvas.toDataURL());
});

canvas.addEventListener('mouseleave', () => {
  aDesenhar = false;
});

// --- Redimensionar a janela (só quando o utilizador a redimensiona) ---
function redimensionarCanvas() {
  const desenhoAtual = canvas.toDataURL();
  ajustarTamanhoCanvas();
  const imgResize = new Image();
  imgResize.onload = () => {
    ctx.drawImage(imgResize, 0, 0);
  };
  imgResize.src = desenhoAtual;
}

window.addEventListener('resize', () => {
  redimensionarCanvas();
  window.notaAPI.guardarTamanho(window.innerWidth, window.innerHeight);
});