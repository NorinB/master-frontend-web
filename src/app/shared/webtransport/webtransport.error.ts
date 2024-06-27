export class WebTransportNotInitializedError extends Error {
  constructor(message = 'WebTransportverbindung ist nicht initialisiert') {
    super(message);
  }
}

export class WebTransportConnectionIsClosedError extends Error {
  constructor(message = 'WebTransportverbindung ist geschlossen') {
    super(message);
  }
}

export class WebTransportConnectionHasBeenClosedError extends Error {
  constructor(message = 'WebTransportverbindung wurde geschlossen') {
    super(message);
  }
}
