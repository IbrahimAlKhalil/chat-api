import { Injectable } from '@nestjs/common';
import websocket from './data/websocket.js';
import postgres from './data/postgres.js';
import app from './data/app.js';

@Injectable()
export class Config {
  websocket = websocket();
  postgres = postgres();
  app = app();
}
