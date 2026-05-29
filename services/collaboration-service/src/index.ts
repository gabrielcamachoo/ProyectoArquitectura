import { createServer } from 'http';
import { createApp } from './app';
import { setupWebsocket } from './websocket';

const port = Number(process.env.PORT || 3000);
const app = createApp();
const server = createServer(app);
setupWebsocket(server);
server.listen(port, () => {
  console.log(`service listening on ${port}`);
});
