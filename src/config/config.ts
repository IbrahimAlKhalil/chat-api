import { Injectable } from '@nestjs/common';
import websocket from './data/websocket.js';
import postgres from './data/postgres.js';
import app from './data/app.js';
import aws from './data/s3.js';

@Injectable()
export class Config {
  websocket = websocket();
  postgres = postgres();
  s3 = aws();
  app = app();
}
