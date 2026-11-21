const { contextBridge, ipcRenderer } = require('electron');
const Store = require('electron-store');
 
const store = new Store();
 
contextBridge.exposeInMainWorld('notaAPI', {
  carregarNotas: () => store.get('listaNotas', []),
  guardarNotas: (notas) => store.set('listaNotas', notas),

  abrirNotaJanela: (notaId) => ipcRenderer.send('abrir-nota', notaId),
  fecharNotaPorId: (notaId) => ipcRenderer.send('fechar-nota-id', notaId),
  fecharJanela: () => ipcRenderer.send('fechar-janela'),
  minimizarJanela: () => ipcRenderer.send('minimizar-janela'),
});