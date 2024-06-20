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

export class CredentialsNotSufficientError extends Error {
  constructor(message = 'Angaben nicht vollständig') {
    super(message);
  }
}

export class UserNameInvalidError extends Error {
  constructor(message = 'Nutzername darf kein "@" enthalten') {
    super(message);
  }
}

export class InvalidStoredCredentialsError extends Error {
  constructor(message = 'Gespeicherte Session ist ungültig') {
    super(message);
  }
}

export class NotLoggedInError extends Error {
  constructor(message = 'Nicht eingeloggt') {
    super(message);
  }
}
