import { createServer } from 'http';
import WebSocket from 'ws';
import express from 'express';
import escapeHtml from 'escape-html';
import fs from 'fs';
import chokidar from 'chokidar';
import marked from 'marked';

const app = express();
app.use(express.static('./app/static'));

// register .md as an engine in express view system
app.engine('md', function (path, options, fn) {
  const layout = fs.readFileSync('./app/layout.html').toString();
  fs.readFile(path, 'utf8', function (err, str) {
    if (err) return fn(err);
    const content = marked.parse(str);
    const html = layout
      .replace('{content}', content)
      .replace(/\{([^}]+)\}/g, function (_, name) {
        return escapeHtml(options[name] || '');
      });
    fn(null, html);
  });
});

app.set('views', './app/views/');

// make it the default so we dont need .md
app.set('view engine', 'md');

app.get('/', function (req, res) {
  res.render('index', { headTitle: 'DIY Hot Reload - Markdown' });
});

// Create an instance of the http server to handle HTTP requests
createServer(app).listen(3000, () => {
  console.log('[server] Listening on http://localhost:3000');
});

// client side refresh
const socketServer = new WebSocket.Server({
  port: 8080,
});

let sockets = [];
socketServer.on('connection', function (socket) {
  sockets.push(socket);
  console.log(`[HotReload] New socket connected (${sockets.length})`);
  socket.on('close', function () {
    sockets = sockets.filter((s) => s !== socket);
    console.log(`[HotReload] Socket disconnected (${sockets.length})`);
  });
});

// Initialize watcher for client refresh
chokidar
  .watch('app')
  .on('error', (error) => console.log(`Watcher error: ${error}`))
  .on('all', (event, path) => {
    console.log(`[chokidar] ${event} ${path}`);
    sockets.forEach((s) => s.send('refresh please'));
  });
