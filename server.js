import dotenv from 'dotenv';
import process from 'process';
import { createServer } from 'http';
import WebSocket from 'ws';
import express from 'express';
import escapeHtml from 'escape-html';
import fs from 'fs';
import chokidar from 'chokidar';
import marked from 'marked';

dotenv.config();
const PORT = process.env.PORT || 3000;
const HOT_RELOAD_PORT = process.env.HOT_RELOAD_PORT || 8085;

const app = express();
app.use(express.static('./app/static'));

// register .md as an engine in express view system
app.engine('md', function (path, options, fn) {
  const layout = fs.readFileSync('./app/layout.html').toString();
  fs.readFile(path, 'utf8', function (err, str) {
    if (err) return fn(err);
    const content = marked.parse(str);
    let html = layout
      .replace('{content}', content)
      .replace(/\{([^}]+)\}/g, function (_, name) {
        return escapeHtml(options[name] || '');
      });

    if (process.env.DEBUG) {
      // add client side script for hot reload
      const hotReload = fs
        .readFileSync('./app/_hotreload.html')
        .toString()
        .replace('HOT_RELOAD_PORT', HOT_RELOAD_PORT);

      // add a display element for showing errors
      const errorDisplay = fs
        .readFileSync('./app/_errorDisplay.html')
        .toString();
      html += hotReload + errorDisplay;
    }
    fn(null, html);
  });
});

app.set('views', './app/views/');

// make it the default so we dont need .md
app.set('view engine', 'md');

app.get('/', function (req, res) {
  res.render('index', {
    headTitle: 'DIY Hot Reload - Markdown',
  });
});

// http server to handle HTTP requests
createServer(app).listen(PORT, () => {
  console.log(`[server] Listening on http://localhost:${PORT}`);
});

if (process.env.DEBUG) {
  // socket server for hot reload
  let sockets = [];
  new WebSocket.Server({ port: HOT_RELOAD_PORT }).on('connection', (socket) => {
    sockets.push(socket);
    console.log(`[HotReload] New socket connected (${sockets.length})`);
    socket.on('close', () => {
      sockets = sockets.filter((s) => s !== socket);
      console.log(`[HotReload] Socket disconnected (${sockets.length})`);
    });
  });

  // file watcher for hot reload
  chokidar
    .watch('app')
    .on('error', (error) => console.log(`Watcher error: ${error}`))
    .on('all', (_, path) => {
      console.log(`[chokidar] Watch ${path}`);
      sockets.forEach((s) => s.send('refresh please'));
    });
}
