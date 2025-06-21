// preload.js

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
    // Example: Replace text in the renderer process
    // const replaceText = (selector, text) => {
    //   const element = document.getElementById(selector);
    //   if (element) element.innerText = text;
    // };

    // for (const dependency of ['chrome', 'node', 'electron']) {
    //   replaceText(`${dependency}-version`, process.versions[dependency]);
    // }
    console.log('Preload script executed. Electron version:', process.versions.electron);
});

// You can expose specific Node.js features to the renderer process in a controlled way
// using contextBridge.
// Example:
// const { contextBridge, ipcRenderer } = require('electron');
// contextBridge.exposeInMainWorld('electronAPI', {
//   sendMessage: (channel, data) => ipcRenderer.send(channel, data),
//   receiveMessage: (channel, func) => {
//     ipcRenderer.on(channel, (event, ...args) => func(...args));
//   }
// });

// For this MVP, we are just loading web content, so a complex preload might not be needed.
// Keeping it minimal.
