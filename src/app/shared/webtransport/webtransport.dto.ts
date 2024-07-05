export class WebTransportMessage<Body> {
  messageType: string;
  body: Body;

  constructor(message: { messageType: string; body: Body }) {
    this.messageType = message.messageType;
    this.body = message.body;
  }
}
