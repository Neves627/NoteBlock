const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const Store = require('electron-store');
const path = require('path');

if (process.platform === 'win32') {
  app.setAppUserModelId('com.noteblock.app');
}

const store = new Store();
const iconPath = path.join(__dirname, 'images', 'logo_mini.png');

function createMenuWindow() {
  const win = new BrowserWindow({
    width: 300,
    height: 400,
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
  const tamanhosNotas = store.get('tamanhosNotas', {});
  const tamanhoGuardado = tamanhosNotas[notaId] || { width: 300, height: 350 };

  const win = new BrowserWindow({
    width: tamanhoGuardado.width,
    height: tamanhoGuardado.height,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    icon: iconPath,
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

  // Verifica atualizações automaticamente (apenas na versão compilada)
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

// Opcional: avisar o utilizador quando o update estiver pronto para reiniciar
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
  const janelas = BrowserWindow.getAllWindows();
  janelas.forEach((win) => {
    if (win.notaId === notaId) {
      win.close();
    }
  });
});