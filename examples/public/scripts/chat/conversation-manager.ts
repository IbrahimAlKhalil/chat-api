import { CrudEvent, CrudEventType } from './types/crud-event';
import { ConversationType } from './types/conversation-type';
import { ConversationRaw } from './types/conversation-raw';
import { RawCudEvent } from './types/raw-cud-event';
import { Conversation } from './conversation.js';
import { Socket } from './socket.js';

type Listener = (event: CrudEvent<Conversation>) => any;

export class ConversationManager {
  constructor(private readonly socket: Socket) {
  }

  private readonly listeners = new Set<Listener>();
  private subscribed = false;

  private instantiate(data: ConversationRaw[], type: CrudEventType): Conversation[] {
    const items: Conversation[] = [];

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

  private handleCDEvent(event: RawCudEvent<'conversation'>): void {
    if (event.action === 'create') {
      this.instantiate([event.data], event.action);
    } else if(event.action === 'delete' && this.conversations[event.data.id]) {
      for (const listener of this.listeners) {
        listener({
          type: 'delete',
          items: [this.conversations[event.data.id]]
        })
      }

      delete this.conversations[event.data.id];
    }
  }

  // ------------- Public ------------------

  public readonly conversations: Record<number, Conversation> = {};
  public limit = 10;
  public page = 0;

  public get(id?: number): Promise<ConversationRaw>;
  public get(page?: number, limit?: number, scope?: 'global' | 'local'): Promise<ConversationRaw[]>
  public async get(...args: [number?, number?, string?]): Promise<ConversationRaw | ConversationRaw[]> {
    const id = args.length === 1 ? args[0] : 0;
    const page = !id ? args[0] ?? this.page : 0;
    const limit = !id ? args[1] ?? this.limit : 0;
    const scope = !id ? args[2] ?? 'local' : '' ;

    return fetch(`${this.socket.url}/conversations${id ? `/${id}` : `?page=${page}&limit=${limit}&scope=${scope}`}`, {
      headers: {
        'Authorization': `Bearer ${this.socket.token}`,
      }
    }).then(res => res.json());
  }

  public create(type: 'group', members: number[], name: string): Promise<ConversationRaw>;
  public create(type: 'dm', member: number): Promise<ConversationRaw>;
  public async create(
    type: ConversationType,
    members: number | number[],
    name?: string
  ): Promise<ConversationRaw> {
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

  public subscribe(listener: Listener): () => void {
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

  public async read(): Promise<Conversation[]> {
    if (!this.subscribed) {
      throw new Error('No subscriber, call subscribe first');
    }

    const conversations = await this.get(++this.page, this.limit);

    return this.instantiate(conversations, 'read');
  }
}