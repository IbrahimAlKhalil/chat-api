import { ConversationManager } from './conversation-manager.js';
import { UserStatusEvent } from './types/user-status-event';
import { Socket } from './socket.js';

export class Chat {
  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly userId: number,
  ) {
  }

  public socket = new Socket(this.url, this.token, this.userId);
  public conversations = new ConversationManager(this.socket);
  private disposeHandlers = new Set<() => any>();

  public onUser(handler: (event: UserStatusEvent) => any): () => void {
    return this.socket.subscribe(0, 'user', handler);
  }

  public onDispose(handler: () => any) {
    this.disposeHandlers.add(handler);
  }

  public dispose() {
    for (const handler of this.disposeHandlers) {
      handler();
    }

    this.disposeHandlers.clear();
    this.socket.dispose();
  }
}