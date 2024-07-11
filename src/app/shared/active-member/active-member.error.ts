export class ActiveMemberNotFoundError extends Error {
  constructor(message = 'User ist aktuell nicht aktiv') {
    super(message);
  }
}

export class BoardHasNoActiveMembersError extends Error {
  constructor(message = 'Board hat keine aktiven User') {
    super(message);
  }
}
