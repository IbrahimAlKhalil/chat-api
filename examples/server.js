import users from './users.json' assert { type: 'json' };
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
    extensions: ['html', '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.map'],
  },
  ignore: (path) => {
    return path.startsWith('.');
  },
});

Server.get('/users', (req, res) => {
  res.status(200).json(users);
});

Server.get('/me', (req, res) => {
  const header = req.header('authorization');
  const token = header.replace('Bearer ', '');

  const user = users.find(user => user.token === token);

  if (user) {
    return res.status(200).json(user);
  }

  return res.status(401).json(`You are not authorized to make this request`);
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
