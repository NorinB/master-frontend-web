export class ElementNotFoundError extends Error {
  constructor(message = 'Element existiert nicht') {
    super(message);
  }
}

export class NoCreatableElementsFoundError extends Error {
  constructor(message = 'Keine erstellenden Elemente gefunden') {
    super(message);
  }
}

export class BoardHasNoElementsError extends Error {
  constructor(message = 'Board hat keine Elemente bisher') {
    super(message);
  }
}
