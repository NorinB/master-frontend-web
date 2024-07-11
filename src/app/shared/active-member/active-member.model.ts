export interface ActiveMember {
  _id: string;
  userId: string;
  boardId: string;
  x: number;
  y: number;
}

export interface CursorPosition {
  x: number;
  y: number;
}
