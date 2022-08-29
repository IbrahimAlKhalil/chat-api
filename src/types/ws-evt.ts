import { Websocket } from 'hyper-express';

export interface WsEvt<T = any> {
  ws: Websocket;
  data: T;
  binary: boolean;
}
