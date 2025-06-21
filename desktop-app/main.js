const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1000, // Adjusted width to better fit the chat UI
        height: 750, // Adjusted height
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            // Recommended for security:
            // contextIsolation: true, // Default in Electron 12+
            // nodeIntegration: false, // Default
            // enableRemoteModule: false, // Default
        },
    });

    // Load the index.html of the app.
    // We need to point to the frontend files, which are outside the 'desktop-app' directory.
    // Assuming 'desktop-app' is at the root, and frontend is in 'src/frontend/'
    mainWindow.loadFile(path.join(__dirname, '../src/frontend/index.html'));

    // Open the DevTools (optional, for development)
    // mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// In this file, you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
