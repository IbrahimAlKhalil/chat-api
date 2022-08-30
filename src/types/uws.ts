import HyperExpress from 'hyper-express';

export type Request = HyperExpress.Request['raw'];
export type Response = HyperExpress.Response['raw'];
type WS = HyperExpress.Websocket['raw'];

export interface Websocket extends WS {
  uid: number;
}
