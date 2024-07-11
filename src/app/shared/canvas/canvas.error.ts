export class CanvasNotReadyError extends Error {
  constructor(message = 'Canvas ist nicht vorbreitet') {
    super(message);
  }
}
