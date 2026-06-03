import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

export function setupWebsocket(server: HttpServer) {
  const io = new Server(server, { cors: { origin: '*' } });
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const pubClient = new Redis(redisUrl, { maxRetriesPerRequest: 1, enableReadyCheck: false });
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
  }

  io.on('connection', (socket) => {
    socket.on('join-forum', (forumId: string) => socket.join(`forum:${forumId}`));
    socket.on('forum-message', (payload: { forumId: string; message: string }) => {
      io.to(`forum:${payload.forumId}`).emit('forum-message', payload);
    });
  });
}
