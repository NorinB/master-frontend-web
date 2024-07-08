export interface ElementTypeDto {
  _id: string;
  name: string;
  path: string;
}

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

export interface LockElementEventMessage {
  _id: string;
  userId: string;
}

export interface MoveElementMessage {
  ids: string[];
  userId: string;
  boardId: string;
  xOffset: string;
  yOffset: string;
}

export interface MoveElementEventMessage {
  _id: string;
  userId: string;
  xOffset: string;
  yOffset: string;
}
