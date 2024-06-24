export class ActiveMemberNotFoundError extends Error {
  constructor(message = 'User ist aktuell nicht aktiv') {
    super(message);
  }
}
