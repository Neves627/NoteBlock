const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const Store = require('electron-store');
const path = require('path');

if (process.platform === 'win32') {
  app.setAppUserModelId('com.noteblock.app');
}

const store = new Store();
const iconPath = path.join(__dirname, 'images', 'logo_mini.png');

let isQuitting = false;
const janelasNotas = new Map();
const timersLimites = new Map();

function limparTimerNota(notaId) {
  const timer = timersLimites.get(notaId);
  if (timer) {
    clearTimeout(timer);
    timersLimites.delete(notaId);
  }
}

function guardarLimitesNota(notaId, win) {
  limparTimerNota(notaId);
  if (!win || win.isDestroyed()) return;
  const bounds = win.getBounds();

  if (typeof bounds.width === 'number' && typeof bounds.height === 'number') {
    const tamanhosNotas = store.get('tamanhosNotas', {});
    tamanhosNotas[notaId] = { width: bounds.width, height: bounds.height };
    store.set('tamanhosNotas', tamanhosNotas);
  }

  if (typeof bounds.x === 'number' && typeof bounds.y === 'number') {
    const posicoesNotas = store.get('posicoesNotas', {});
    posicoesNotas[notaId] = { x: bounds.x, y: bounds.y };
    store.set('posicoesNotas', posicoesNotas);
  }
}

function agendarGuardarLimitesNota(notaId, win, atrasoMs = 180) {
  limparTimerNota(notaId);
  const timer = setTimeout(() => {
    timersLimites.delete(notaId);
    guardarLimitesNota(notaId, win);
  }, atrasoMs);
  timersLimites.set(notaId, timer);
}

function guardarTodasAsNotasAbertas() {
  janelasNotas.forEach((win, notaId) => {
    guardarLimitesNota(notaId, win);
  });
}

function adicionarNotaAberta(notaId) {
  const abertas = store.get('notasAbertas', []);
  if (!abertas.includes(notaId)) {
    abertas.push(notaId);
    store.set('notasAbertas', abertas);
  }
}

function removerNotaAberta(notaId) {
  const abertas = store.get('notasAbertas', []);
  const filtradas = abertas.filter((id) => id !== notaId);
  store.set('notasAbertas', filtradas);
}

function createMenuWindow() {
  const win = new BrowserWindow({
    width: 300,
    height: 400,
    minWidth: 360,
    minHeight: 380,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    show: false,
    backgroundColor: '#12101c',
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    }
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  win.loadFile('menu.html');
}

function createNoteWindow(notaId) {
  if (!notaId) return;

  const existente = janelasNotas.get(notaId);
  if (existente && !existente.isDestroyed()) {
    existente.focus();
    adicionarNotaAberta(notaId);
    return;
  }

  const tamanhosNotas = store.get('tamanhosNotas', {});
  const posicoesNotas = store.get('posicoesNotas', {});
  const tamanhoGuardado = tamanhosNotas[notaId] || { width: 300, height: 350 };
  const posicaoGuardada = posicoesNotas[notaId];
  const temPosicao =
    posicaoGuardada &&
    typeof posicaoGuardada.x === 'number' &&
    typeof posicaoGuardada.y === 'number';

  const opcoesJanela = {
    width: tamanhoGuardado.width,
    height: tamanhoGuardado.height,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    show: false,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    }
  };

  if (temPosicao) {
    opcoesJanela.x = posicaoGuardada.x;
    opcoesJanela.y = posicaoGuardada.y;
  }

  const win = new BrowserWindow(opcoesJanela);
  win.notaId = notaId;
  janelasNotas.set(notaId, win);
  adicionarNotaAberta(notaId);

  if (temPosicao) {
    win.setPosition(posicaoGuardada.x, posicaoGuardada.y);
  }

  win.once('ready-to-show', () => {
    if (temPosicao) {
      win.setPosition(posicaoGuardada.x, posicaoGuardada.y);
    }
    win.show();
  });

  win.on('resize', () => agendarGuardarLimitesNota(notaId, win));
  win.on('resized', () => agendarGuardarLimitesNota(notaId, win));
  win.on('move', () => agendarGuardarLimitesNota(notaId, win));
  win.on('moved', () => agendarGuardarLimitesNota(notaId, win));

  win.on('close', () => {
    guardarLimitesNota(notaId, win);
    janelasNotas.delete(notaId);

    if (!isQuitting) {
      removerNotaAberta(notaId);
    }
  });

  win.loadFile('index.html', { query: { id: notaId } });
}

function reabrirNotasGuardadas() {
  const notasAbertas = store.get('notasAbertas', []);
  const listaNotas = store.get('listaNotas', []);
  const idsExistentes = new Set(listaNotas.map((n) => n.id));

  const idsValidos = notasAbertas.filter((id) => idsExistentes.has(id));
  store.set('notasAbertas', idsValidos);

  idsValidos.forEach((notaId) => {
    createNoteWindow(notaId);
  });
}

function prepararEncerramento() {
  isQuitting = true;
  guardarTodasAsNotasAbertas();
}

app.on('before-quit', () => {
  prepararEncerramento();
});

process.on('SIGINT', () => {
  prepararEncerramento();
  app.exit(0);
});

process.on('SIGTERM', () => {
  prepararEncerramento();
  app.exit(0);
});

app.whenReady().then(() => {
  app.setAppUserModelId('com.noteblock.app');

  createMenuWindow();
  reabrirNotasGuardadas();

  if (app.isPackaged) {
    app.setLoginItemSettings({ openAtLogin: true });
    autoUpdater.checkForUpdatesAndNotify();
  }
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Atualização disponível',
    message: 'Uma nova versão do NoteBlock foi descarregada. A aplicação vai reiniciar para atualizar.',
    buttons: ['Reiniciar agora']
  }).then(() => {
    autoUpdater.quitAndInstall();
  });
});

ipcMain.on('fechar-janela', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

ipcMain.on('abrir-nota', (event, notaId) => {
  createNoteWindow(notaId);
});

ipcMain.on('minimizar-janela', (event) => {
  const janela = BrowserWindow.fromWebContents(event.sender);
  if (janela) {
    janela.minimize();
  }
});

ipcMain.on('fechar-nota-id', (event, notaId) => {
  removerNotaAberta(notaId);
  const janelas = BrowserWindow.getAllWindows();
  janelas.forEach((win) => {
    if (win.notaId === notaId) {
      win.close();
    }
  });
});