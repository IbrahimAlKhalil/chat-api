export type EvtType = 'join' | 'leave';

export class Chat {
  constructor(private readonly url: string, private readonly token: string) {
    this.init();
  }

  private readonly channels = new Map<number, Set<(data: any) => any>>();
  private readonly queue: [EvtType, any][] = [];

  private retryTimeout: NodeJS.Timeout | null = null;
  private ws: WebSocket | null = null;
  private disposed = false;

  private get wsURL(): string {
    const url = new URL(this.url);
    url.protocol = 'ws:';
    url.pathname = `${url.pathname}/${encodeURIComponent(this.token)}`;

    return url.toString();
  }

  private init(recover: boolean = false) {
    this.ws = new WebSocket(this.wsURL);

    this.ws.onerror = console.error;

    this.ws.onopen = () => {
      if (recover) {
        for (const channel of this.channels) {
          this.ws?.send(JSON.stringify(['join', channel[0]]));
        }
      }

      for (const payload of this.queue) {
        this.ws?.send(JSON.stringify(payload));
      }

      this.queue.splice(0, this.queue.length);
    };

    this.ws.onmessage = (message) => {
      if (!message.data) {
        return;
      }

      const payload = JSON.parse(message.data);
      const channel = this.channels.get(payload[0]);

      if (!channel) {
        return console.warn(`No handler attached, for channel ${payload[0]}`);
      }

      for (const listener of channel) {
        listener(payload[1]);
      }
    };

    this.ws.onclose = () => {
      if (this.disposed) {
        return;
      }

      this.retryTimeout = setTimeout(() => {
        this.init(true);
      }, 2000);
    };
  }

  private send(data: ['join' | 'leave', number]) {
    if (this.ws?.readyState === 1) {
      return this.ws.send(JSON.stringify(data));
    }

    this.queue.push(data)
  }

  public dispose(): void {
    this.disposed = true;
    this.channels.clear();
    this.ws?.close();
  }

  public subscribe<Data = any>(channel: number, listener: (data: Data) => any): () => any {
    const listeners = this.channels.get(channel);

    if (!listeners) {
      this.channels.set(channel, new Set([listener]));
    } else {
      listeners.add(listener);
    }

    this.send(['join', channel]);

    return () => {
      const listeners = this.channels.get(channel);

      if (!listeners) {
        return;
      }

      listeners.delete(listener);

      if (listeners.size === 0) {
        this.channels.delete(channel);
        this.send(['leave', channel]);
      }
    };
  }

  public unsubscribeAll(channel: number): void {
    this.channels.delete(channel);
    this.send(['leave', channel]);
  }
}