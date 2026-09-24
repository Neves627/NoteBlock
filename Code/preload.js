const { contextBridge } = require('electron');
const Store = require('electron-store');


const store = new Store(); 
contextBridge.exposeInMainWorld('notaAPI', {
     guardar: (texto) => store.set('notaTexto', texto), 
     carregar: () => store.get('notaTexto', '') 
    });