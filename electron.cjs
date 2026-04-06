const { app, BrowserWindow } = require('electron');
const path = require('path');
const jsonServer = require('json-server');
const fs = require('fs');

let mainWindow;


const dbPath = app.isPackaged
    ? path.join(app.getPath('userData'), 'db.json')
    : path.join(__dirname, 'db.json');


if (!fs.existsSync(dbPath)) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify({ events: [] }));
    } catch (e) {
        console.error("Не удалось создать БД:", e);
    }
}

const server = jsonServer.create();
const router = jsonServer.router(dbPath);
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(router);

const serverInstance = server.listen(3000, () => {
    console.log('JSON Server running on port 3000');
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log('Порт 3000 занят, используем существующий процесс.');
    } else {
        console.error('Ошибка сервера:', err);
    }
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    const isDev = !app.isPackaged;

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {

        const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
        mainWindow.loadFile(indexPath).catch(err => console.error("Ошибка loadFile:", err));
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        if (!isDev) mainWindow.setFullScreen(true);
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});