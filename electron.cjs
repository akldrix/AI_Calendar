const {app, BrowserWindow} = require('electron');
const path = require('path');
const jsonServer = require('json-server');
const fs = require('fs');

const server = jsonServer.create();
const middlewares = jsonServer.defaults();

const dbPath = app.isPackaged
    ? path.join(process.resourcesPath, 'db.json')
    : path.join(__dirname, 'db.json');

if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({events: []}));
}

const router = jsonServer.router(dbPath);
server.use(middlewares);
server.use(router);
server.listen(3000, () => {
    console.log('JSON Server running on port 3000');
});

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        fullscreen: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    const isDev = !app.isPackaged;

    const startUrl = isDev
        ? 'http://localhost:5173'
        : `file://${path.join(__dirname, 'dist', 'index.html')}`;

    win.loadURL(startUrl).catch(e => console.error("Failed to load URL:", e));


    win.webContents.openDevTools();
}

app.whenReady().then(createWindow);
