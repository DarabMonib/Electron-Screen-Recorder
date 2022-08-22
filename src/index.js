const { app, BrowserWindow, desktopCapturer, ipcMain, dialog } = require('electron');
const path = require('path');
const { writeFile } = require('fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line global-require
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 500,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    enableRemoteModule: true,
    resizable: false
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  desktopCapturer.getSources({ types: ['window', 'screen'] })
  .then(async sources => {
    for (const source of sources) {
      if (source.name === 'Entire screen') {
        console.log('Got the source!')  
        mainWindow.webContents.send('SET_SOURCE', source.id)
        return
      }
    }
  })

  ipcMain.on('save-dialog', (ev, buffer) => {

    async function saveDialog() {
  
      const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save',
        defaultPath: `recording-${Date.now()}.webm`
      })
      writeFile(filePath, buffer, () => {
        console.log('saved!')
      })
  
    }
    saveDialog()
  
  })

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.