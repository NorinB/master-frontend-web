export class UnexpectedApiError extends Error {
  constructor(message = 'Unerwarteter Fehler beim Api Aufruf') {
    super(message);
  }
}
