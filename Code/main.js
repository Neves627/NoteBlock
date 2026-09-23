
const {app, BrowserWindow} = require('electron');

function createWindow() {
    const win = new BrowserWindow({
    width: 250,
    height: 250,
    frame: false,
    alwaysOnTop: true,
    resizable: true
    });

    win.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();
});