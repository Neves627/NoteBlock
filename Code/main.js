const {app, BrowserWindow} = require('electron');
const Store = require('electron-store');


const store = new Store();

function createWindow() {
    const path = require('path'); 
    const win = new BrowserWindow({
        width: 250,
        height: 250,
        frame: false,
        alwaysOnTop: true,
        resizable: true,
        webPreferences: { preload: path.join(__dirname, 'preload.js'), sandbox: false } });

    win.loadFile('index.html');

}

app.whenReady().then(() => {
    createWindow();
});