import { createServer } from 'http';
import WebSocket from 'ws';
import express from 'express';
import escapeHtml from 'escape-html';
import fs from 'fs';
import marked from 'marked';

const app = express();
app.use(express.static('./app/static'));

// register .md as an engine in express view system
app.engine('md', function (path, options, fn) {
  fs.readFile(path, 'utf8', function (err, str) {
    if (err) return fn(err);
    const head = fs.readFileSync('./app/views/head.html').toString();
    const livereload = fs
      .readFileSync('./app/views/livereload.html')
      .toString();
    //'<head><link rel="icon" type="image/png" href="/favicon.svg" /></head>';
    const html = marked.parse(str).replace(/\{([^}]+)\}/g, function (_, name) {
      return escapeHtml(options[name] || '');
    });
    fn(null, head + html + livereload);
  });
});

app.set('views', './app/views/');

// make it the default so we dont need .md
app.set('view engine', 'md');

app.get('/', function (req, res) {
  res.render('index', { title: 'De Mike Show', favicon: './favicon.svg' });
});

// Create an instance of the http server to handle HTTP requests
const server = createServer(app);

// client side hot reload/refresh
const socketServer = new WebSocket.Server({
  port: 8080,
});

let sockets = [];
socketServer.on('connection', function (socket) {
  console.log('Connection made!');
  sockets.push(socket);

  // When you receive a message, send that message to every socket.
  socket.on('message', function (msg) {
    sockets.forEach((s) => s.send(msg));
  });

  // When a socket closes, or disconnects, remove it from the array.
  socket.on('close', function () {
    sockets = sockets.filter((s) => s !== socket);
  });
});

var watchPath = './app/views';
fs.watchFile(watchPath, (curr, prev) => {
  console.log(`\n ${prev} was modified to ${curr}\n`);
  sockets.forEach((s) => s.send('refresh please'));
});

server.listen(3000, () => {
  console.log('Listening on http://localhost:3000');
});
