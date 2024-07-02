export interface ElementType {
  _id: string;
  name: string;
  path: string;
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
