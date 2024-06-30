import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const PORT = 8080;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on('connection', socket => {

});

server.listen(PORT, () => {
  console.log(`Server run on: http://localhost:8080`);
});