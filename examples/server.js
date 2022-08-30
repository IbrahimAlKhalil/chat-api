import LiveDirectory from 'live-directory';
import HyperExpress from 'hyper-express';
import dotenv from 'dotenv';
import * as url from 'url';
import path from 'path';

dotenv.config({
  path: '../.env',
});

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const Server = new HyperExpress.Server();

const LiveAssets = new LiveDirectory({
  path: path.resolve(__dirname, './public'),
  keep: {
    extensions: ['html', '.css', '.js', '.json', '.png', '.jpg', '.jpeg'],
  },
  ignore: (path) => {
    return path.startsWith('.');
  },
});

// Create static serve route to serve frontend assets
Server.get('/*', (request, response) => {
  const file = LiveAssets.get(
    request.path === '/' ? '/index.html' : request.path,
  );

  // Return a 404 if no asset/file exists on the derived path
  if (file === undefined) return response.status(404).send();

  // Set appropriate mime-type and serve file buffer as response body
  return response.type(file.extension).send(file.buffer);
});

Server.listen(Number(process.env.EXAMPLES_PORT), process.env.HOST).then(() => {
  console.log(
    `Examples: http://${process.env.HOST}:${process.env.EXAMPLES_PORT}`,
  );
});
