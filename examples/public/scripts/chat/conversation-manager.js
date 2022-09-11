import { Conversation } from './conversation.js';
export class ConversationManager {
    constructor(socket) {
        this.socket = socket;
        this.listeners = new Set();
        this.subscribed = false;
        // ------------- Public ------------------
        this.conversations = {};
        this.limit = 10;
        this.page = 0;
    }
    instantiate(data, type) {
        const items = [];
        for (const item of data) {
            if (!this.conversations[item.id]) {
                const conversation = new Conversation(item, this);
                this.conversations[item.id] = conversation;
                items.push(conversation);
            }
        }
        for (const listener of this.listeners) {
            listener({ type, items });
        }
        return items;
    }
    handleCDEvent(event) {
        if (event.action === 'create') {
            this.instantiate([event.data], event.action);
        }
        else if (event.action === 'delete' && this.conversations[event.data.id]) {
            for (const listener of this.listeners) {
                listener({
                    type: 'delete',
                    items: [this.conversations[event.data.id]]
                });
            }
            delete this.conversations[event.data.id];
        }
    }
    async get(id, page = this.page, limit = this.limit) {
        return fetch(`${this.socket.url}/conversations${id ? `/${id}` : `?page=${page}&limit=${limit}`}`, {
            headers: {
                'Authorization': `Bearer ${this.socket.token}`,
            }
        }).then(res => res.json());
    }
    async create(type, members, name) {
        if (typeof members === 'number') {
            members = [members];
        }
        return fetch(`${this.socket.url}/conversations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.socket.token}`,
            },
            body: JSON.stringify({ type, name: name ?? undefined, members }),
        }).then(res => res.json());
    }
    subscribe(listener) {
        if (!this.subscribed) {
            this.subscribed = true;
            this.socket.subscribe(this.socket.userId * -1, 'conversation', this.handleCDEvent.bind(this));
            this.read();
        }
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }
    async read() {
        if (!this.subscribed) {
            throw new Error('No subscriber, call subscribe first');
        }
        const conversations = await this.get(undefined, ++this.page, this.limit);
        return this.instantiate(conversations, 'read');
    }
}
//# sourceMappingURL=conversation-manager.js.map