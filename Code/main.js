const { app, BrowserWindow, ipcMain } = require('electron');
const Store = require('electron-store');
const path = require('path');

const store = new Store();

function createMenuWindow() {
  const win = new BrowserWindow({
    width: 300,
    height: 400,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    }
  });
  win.loadFile('menu.html');
}

function createNoteWindow(notaId) {
  const tamanhosNotas = store.get('tamanhosNotas', {});
  const tamanhoGuardado = tamanhosNotas[notaId] || { width: 300, height: 350 };

  const win = new BrowserWindow({
    width: tamanhoGuardado.width,
    height: tamanhoGuardado.height,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    }
  });

  win.notaId = notaId;

  win.on('resize', () => {
    const [width, height] = win.getSize();
    const currentTamanhos = store.get('tamanhosNotas', {});
    currentTamanhos[notaId] = { width, height };
    store.set('tamanhosNotas', currentTamanhos);
  });

  win.loadFile('index.html', { query: { id: notaId } });
}

app.whenReady().then(() => {
  createMenuWindow();
});

ipcMain.on('fechar-janela', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

ipcMain.on('abrir-nota', (event, notaId) => {
  createNoteWindow(notaId);
});

ipcMain.on('fechar-nota-id', (event, notaId) => {
  const janelas = BrowserWindow.getAllWindows();
  janelas.forEach((win) => {
    if (win.notaId === notaId) {
      win.close();
    }
  });
});