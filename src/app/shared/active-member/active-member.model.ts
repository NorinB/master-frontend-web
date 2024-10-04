export interface ActiveMemberWithName {
  _id: string;
  userId: string;
  boardId: string;
  x: number;
  y: number;
  name?: string;
}

export interface CursorPosition {
  x: number;
  y: number;
}
