export type CrudEventType = 'read' | 'create' | 'delete';

export interface CrudEvent<T> {
  type: 'read' | 'create' | 'delete';
  items: T[];
}