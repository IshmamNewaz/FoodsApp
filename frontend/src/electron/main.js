import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.on('ready', () => {
  const mainWindow = new BrowserWindow({
    width: 500,
    height: 800, // A reasonable height for a mobile-like experience
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', '..', 'dist-react', 'index.html'));
})