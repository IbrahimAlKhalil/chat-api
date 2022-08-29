import { WsEvt } from './ws-evt';

export interface WsReq<T> extends WsEvt<T> {
  id: number;
}
