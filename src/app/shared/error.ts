export class UnexpectedApiError extends Error {
  constructor(message = 'Unerwarteter Fehler beim Api Aufruf') {
    super(message);
  }
}

export class UserNotPartOfAnyBoardError extends Error {
  constructor(message = 'User nimmt an keinem Board Teil') {
    super(message);
  }
}
