// ============================================
// IMAGENS — colar, apagar, arrastar e redimensionar
// ============================================
function inserirImagemRedimensionavel(src) {
  const wrapper = document.createElement('span');
  wrapper.className = 'imagem-wrapper';
  wrapper.contentEditable = false;
  wrapper.style.width = '150px';
  wrapper.style.height = '150px';
  wrapper.style.left = '10px';
  wrapper.style.top = '10px';

  const img = document.createElement('img');
  img.src = src;

  const btnApagar = document.createElement('button');
  btnApagar.className = 'btn-apagar-imagem';
  btnApagar.textContent = '✕';

  wrapper.appendChild(img);
  wrapper.appendChild(btnApagar);
  texto.appendChild(wrapper);

  window.notaAPI.guardar(texto.innerHTML);
}

// Colar imagem (Ctrl+V)
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

// Apagar imagem: UM listener na área de texto para todos os botões ✕.
// Funciona também nas imagens guardadas de sessões anteriores
// (os listeners individuais perdiam-se ao reabrir a app).
texto.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-apagar-imagem')) {
    e.target.closest('.imagem-wrapper').remove();
    window.notaAPI.guardar(texto.innerHTML);
  }
});

// Arrastar e redimensionar (interact.js)
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
        window.notaAPI.guardar(texto.innerHTML);
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
        window.notaAPI.guardar(texto.innerHTML);
      }
    }
  });