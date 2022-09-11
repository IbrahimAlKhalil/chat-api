export class Socket {
    constructor(url, token, userId) {
        this.url = url;
        this.token = token;
        this.userId = userId;
        this.channels = new Map();
        this.queue = [];
        this.retryTimeout = null;
        this.ws = null;
        this.disposed = false;
        this.init();
    }
    get wsURL() {
        const url = new URL(this.url);
        url.protocol = location.protocol === 'http:' ? 'ws:' : 'wss:';
        url.pathname = `/ws/${encodeURIComponent(this.token)}`;
        return url.toString();
    }
    init(retrying = false) {
        this.ws = new WebSocket(this.wsURL);
        this.ws.onerror = console.error;
        this.ws.onopen = () => {
            if (retrying) {
                for (const channel of this.channels) {
                    if (channel[0] > 0) {
                        this.ws?.send(JSON.stringify(['join', channel[0]]));
                    }
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
            if (!channel || channel[payload[1].type].size === 0) {
                return console.warn(`No handler attached for event "${payload[1].type}" at channel ${payload[0]}`);
            }
            for (const handler of channel[payload[1].type]) {
                handler(payload[1]);
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
    send(data) {
        if (this.ws?.readyState === 1) {
            return this.ws.send(JSON.stringify(data));
        }
        this.queue.push(data);
    }
    dispose() {
        this.disposed = true;
        this.channels.clear();
        this.queue.splice(0, this.queue.length);
        this.ws?.close();
    }
    subscribe(channel, event, listener) {
        const _channel = this.channels.get(channel);
        if (!_channel) {
            this.channels.set(channel, {
                [event]: new Set([listener]),
            });
            // You are already subscribed to your private channel, no need send "join"
            if (channel >= 0) {
                this.send(['join', channel]);
            }
        }
        else if (!_channel[event]) {
            _channel[event] = new Set();
        }
        else {
            _channel[event].add(listener);
        }
        return () => {
            const _channel = this.channels.get(channel);
            if (!_channel || !_channel[event]) {
                return;
            }
            _channel[event].delete(listener);
            if (_channel[event].size === 0) {
                delete _channel[event];
                if (Object.keys(_channel).length === 0) {
                    this.channels.delete(channel);
                    if (channel >= 0) {
                        this.send(['leave', channel]);
                    }
                }
            }
        };
    }
    unsubscribeAll(channel, event) {
        if (event) {
            delete this.channels.get(channel)?.[event];
        }
        else {
            this.channels.delete(channel);
            if (channel >= 0) {
                this.send(['leave', channel]);
            }
        }
    }
}
//# sourceMappingURL=socket.js.map