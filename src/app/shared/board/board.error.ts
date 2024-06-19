export class BoardNotFoundError extends Error {
  constructor(message = 'Board existiert nicht') {
    super(message);
  }
}

export class UserNotPartOfThisBoardError extends Error {
  constructor(message = 'User ist kein Teil dieses Boards') {
    super(message);
  }
}

export class UserNotPartOfAnyBoardError extends Error {
  constructor(message = 'User nimmt an keinem Board Teil') {
    super(message);
  }
}
