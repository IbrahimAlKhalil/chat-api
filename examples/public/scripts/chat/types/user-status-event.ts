export interface UserStatusEvent {
  uid: number,
  type: 'user';
  online: boolean;
}