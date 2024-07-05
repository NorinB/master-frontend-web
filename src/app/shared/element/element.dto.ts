export interface CreateElementEventMessage {
  _id: string;
  userId: string;
  selected: boolean;
  lockedBy: string;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  zIndex: number;
  createdAt: string;
  text: string;
  elementType: string;
  boardId: string;
  color: string;
}

export interface CreateElementMessage {
  _id: string;
  userId: string;
  selected: boolean;
  lockedBy: string | null;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  zIndex: number;
  createdAt: string;
  text: string;
  elementType: string;
  boardId: string;
  color: string;
}

export interface RemoveElementEventMessage {
  _id: string;
  userId: string;
}

export interface RemoveElementMessage {
  _id: string;
  boardId: string;
  userId: string;
}
