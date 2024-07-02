export class CanvasNotReadyError extends Error {
  constructor(message = 'Canvas ist nicht vorbreitet') {
    super(message);
  }
}

export class ElementNotFoundError extends Error {
  constructor(message = 'Element existiert nicht') {
    super(message);
  }
}
