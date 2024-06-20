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

export class UserAlreadyPartOfThisBoardError extends Error {
  constructor(message = 'User ist bereits Teil dieses Boards') {
    super(message);
  }
}

export class UserNotPartOfAnyBoardError extends Error {
  constructor(message = 'User nimmt an keinem Board Teil') {
    super(message);
  }
}

export class NotInABoardCurrentlyError extends Error {
  constructor(message = 'Dazu musst du in einem Board sein') {
    super(message);
  }
}
