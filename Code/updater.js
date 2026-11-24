// ============================================
// UPDATER — deteta e instala novas versões (GitHub Releases)
// Só funciona na app instalada (app.isPackaged), nunca com "npm start".
// ============================================
const { app, dialog, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const path = require('path');

const INTERVALO_VERIFICACAO = 4 * 60 * 60 * 1000; // 4 horas

// A app instalada não tem consola, por isso o que acontece fica num ficheiro:
// updater.log, na pasta de dados da app (a mesma onde está o config.json
// do electron-store, dentro de %APPDATA%).
function registar(mensagem) {
  const linha = `[${new Date().toISOString()}] ${mensagem}\n`;
  try {
    fs.appendFileSync(path.join(app.getPath('userData'), 'updater.log'), linha);
  } catch (e) {}
}

function verificar() {
  // O erro já é registado no evento 'error' mais abaixo
  autoUpdater.checkForUpdates().catch(() => {});
}

function configurarAtualizacoes() {
  autoUpdater.autoDownload = true;          // descarrega sozinho quando há versão nova
  autoUpdater.autoInstallOnAppQuit = true;  // se escolheres "Mais tarde", instala ao fechar

  registar(`Updater iniciado. Versão instalada: ${app.getVersion()}`);

  autoUpdater.on('checking-for-update', () => registar('A verificar atualizações...'));
  autoUpdater.on('update-available', (info) => registar('Nova versão disponível: ' + info.version));
  autoUpdater.on('update-not-available', (info) => {
    registar('Sem versão mais recente (a mais recente publicada é a ' + info.version + ').');
  });
  autoUpdater.on('error', (err) => registar('Erro: ' + (err ? err.message : 'desconhecido')));

  autoUpdater.on('update-downloaded', (info) => {
    registar('Versão descarregada: ' + info.version);

    // As janelas da app ficam sempre por cima (alwaysOnTop). Sem janela-mãe,
    // o diálogo podia aparecer escondido por baixo delas.
    const janelaMae = BrowserWindow.getAllWindows()[0];
    const opcoes = {
      type: 'info',
      title: 'Atualização pronta',
      message: `A versão ${info.version} foi descarregada.`,
      detail: 'Queres reiniciar agora para instalar?',
      buttons: ['Reiniciar agora', 'Mais tarde'],
      defaultId: 0,
      cancelId: 1
    };

    const pergunta = janelaMae
      ? dialog.showMessageBox(janelaMae, opcoes)
      : dialog.showMessageBox(opcoes);

    pergunta.then(({ response }) => {
      if (response === 0) {
        // true, true = instala sem assistente e volta a abrir a app
        autoUpdater.quitAndInstall(true, true);
      }
    });
  });

  // Verifica ao arrancar e depois de 4 em 4 horas
  // (a app arranca com o Windows e pode ficar aberta dias)
  verificar();
  setInterval(verificar, INTERVALO_VERIFICACAO);
}

module.exports = { configurarAtualizacoes };