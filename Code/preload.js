const { contextBridge, ipcRenderer } = require('electron');
const Store = require('electron-store');


const store = new Store(); 
contextBridge.exposeInMainWorld('notaAPI', {
     guardar: (texto) => store.set('notaTexto', texto), 
     carregar: () => store.get('notaTexto', ''), 
     guardarDesenho: (dataUrl) => store.set('notaDesenho', dataUrl),
     carregarDesenho: () => store.get('notaDesenho', null),
     guardarTamanho: (largura, altura) => store.set('tamanhoJanela', { largura, altura }),
     carregarTamanho: () => store.get('tamanhoJanela', { largura: 250, altura: 250 }),
     fecharJanela: () => ipcRenderer.send('fechar-janela'),
    });