export interface ElementType {
  name: string;
  path: string;
}

export interface ElementPosition {
  x: number;
  y: number;
}

export interface Element {
  _id: string;
  selected: false;
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

export enum Color {
  Yellow = 'yellow',
  Green = 'green',
  Red = 'red',
  Blue = 'blue',
  Purple = 'purple',
  Pink = 'pink',
  Black = 'black',
}

function shuffleColors(array): Color[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function getRandomColor(): Color {
  return shuffleColors(Object.values(Color))[0];
}
