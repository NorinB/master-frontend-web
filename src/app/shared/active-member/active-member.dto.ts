export interface ActiveMemberUpdatePositionMessage {
  userId: string;
  boardId: string;
  x: number;
  y: number;
}

export interface ActiveMemberAddEventMessage {
  _id: string;
  boardId: string;
  userId: string;
}

export interface ActiveMemberRemoveEventMessage {
  userId: string;
}

export interface ActiveMemberUpdatePositionEventMessage {
  userId: string;
  x: number;
  y: number;
}
