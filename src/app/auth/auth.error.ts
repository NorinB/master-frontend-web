export class UserAlreadyExistsError extends Error {
  constructor(message = 'Nutzer existiert bereits') {
    super(message);
  }
}

export class UserNotFoundError extends Error {
  constructor(message = 'Nutzer existiert nicht') {
    super(message);
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Nicht autorisiert') {
    super(message);
  }
}
