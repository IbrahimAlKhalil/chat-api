import { ConversationManager } from './conversation-manager.js';
import { Socket } from './socket.js';
export class Chat {
    constructor(url, token, userId) {
        this.url = url;
        this.token = token;
        this.userId = userId;
        this.socket = new Socket(this.url, this.token, this.userId);
        this.conversations = new ConversationManager(this.socket);
        this.disposeHandlers = new Set();
    }
    onUser(handler) {
        return this.socket.subscribe(0, 'user', handler);
    }
    onDispose(handler) {
        this.disposeHandlers.add(handler);
    }
    dispose() {
        for (const handler of this.disposeHandlers) {
            handler();
        }
        this.disposeHandlers.clear();
        this.socket.dispose();
    }
}
//# sourceMappingURL=chat.js.map