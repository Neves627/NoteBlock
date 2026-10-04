const { app, BrowserWindow, ipcMain } = require('electron');
const Store = require('electron-store');
const path = require('path');

const store = new Store();

function createWindow() {
  const tamanhoGuardado = store.get('tamanhoJanela', { largura: 250, altura: 250 });

  const win = new BrowserWindow({
    width: tamanhoGuardado.largura,
    height: tamanhoGuardado.altura,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    }
  });

  win.loadFile('index.html');
  //win.webContents.openDevTools();
}

ipcMain.on('fechar-janela', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

app.whenReady().then(() => {
  createWindow();
});