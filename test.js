var boardId = '6654ef80584b12a4910e7f39';
var certificate = [
  225, 166, 205, 37, 214, 104, 250, 122, 172, 255, 62, 95, 54, 215, 176, 25, 26, 41, 67, 16, 126, 19, 127, 103, 181, 146, 161, 210, 27, 130, 85, 91,
];

async function testWebTransport() {
  // Create a WebTransport instance connecting to the Rust server
  const certificateArray = new Uint8Array(certificate);
  console.log('Starte WebTransport...');
  let transport = new WebTransport('https://[::1]:3031', {
    serverCertificateHashes: [{ algorithm: 'sha-256', value: certificateArray.buffer }],
  });
  await transport.ready;

  // Create a bidirectional stream
  const stream = await transport.createBidirectionalStream();
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();

  const initMessage = {
    messageType: 'init',
    eventCategory: 'board',
    contextId: boardId,
  };

  console.log('Before Write a mesage');

  // Send data from the client to the server
  await writer.write(new TextEncoder().encode(JSON.stringify(initMessage)));

  console.log('After Write a mesage');
  // Read data reply from the server
  let data = await reader.read();
  console.log(new TextDecoder().decode(data.value));

  const boardAddedMessage = {
    message_type: 'board_memberadd',
    boardId: boardId,
    userId: '6654b896b687bac73d51e6da',
  };

  // Send data from the client to the server
  await writer.write(new TextEncoder().encode(JSON.stringify(boardAddedMessage)));

  // Read data reply from the server
  data = await reader.read();
  console.log(new TextDecoder().decode(data.value));

  const boardRemovedJson = {
    message_type: 'board_memberremove',
    boardId: boardId,
    userId: '6654b896b687bac73d51e6da',
  };

  // Send data from the client to the server
  await writer.write(new TextEncoder().encode(JSON.stringify(boardRemovedJson)));

  // Read data reply from the server
  data = await reader.read();
  console.log(new TextDecoder().decode(data.value));

  transport.close();
}

// testBoardMessage();
async function testBoardMessage() {
  // Create a WebTransport instance connecting to the Rust server
  const certificateArray = new Uint8Array(certificate);
  console.log('Starte WebTransport...');
  let transport = new WebTransport('https://[::1]:3031', {
    serverCertificateHashes: [{ algorithm: 'sha-256', value: certificateArray.buffer }],
  });
  await transport.ready;

  // Create a bidirectional stream
  const stream = await transport.createBidirectionalStream();
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();

  const initMessage = {
    messageType: 'init',
    eventCategory: 'board',
    contextId: boardId,
  };

  console.log('init with boardId: ', initMessage.contextId);
  await writer.write(new TextEncoder().encode(JSON.stringify(initMessage)));

  console.log('Warte auf Init Message');
  let data = await reader.read();
  console.log(new TextDecoder().decode(data.value));

  console.log('Warte auf Async Message');
  for (let i = 0; i < 2; i++) {
    data = await reader.read();
    console.log(new TextDecoder().decode(data.value));
  }

  transport.close();
}

async function testElementMessage() {
  // Create a WebTransport instance connecting to the Rust server
  const certificateArray = new Uint8Array(certificate);
  console.log('Starte WebTransport...');
  let transport = new WebTransport('https://[::1]:3031', {
    serverCertificateHashes: [{ algorithm: 'sha-256', value: certificateArray.buffer }],
  });
  await transport.ready;

  // Create a bidirectional stream
  const stream = await transport.createBidirectionalStream();
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();

  const initMessage = {
    messageType: 'init',
    eventCategory: 'element',
    contextId: boardId,
  };

  console.log('init with boardId: ', initMessage.contextId);
  await writer.write(new TextEncoder().encode(JSON.stringify(initMessage)));

  console.log('Warte auf Init Message');
  let data = await reader.read();
  console.log(new TextDecoder().decode(data.value));

  console.log('Warte auf Async Message');
  for (let i = 0; i < 2; i++) {
    data = await reader.read();
    console.log(new TextDecoder().decode(data.value));
  }

  transport.close();
}

async function testActiveMemberMessage() {
  // Create a WebTransport instance connecting to the Rust server
  const certificateArray = new Uint8Array(certificate);
  console.log('Starte WebTransport...');
  let transport = new WebTransport('https://[::1]:3031', {
    serverCertificateHashes: [{ algorithm: 'sha-256', value: certificateArray.buffer }],
  });
  await transport.ready;

  // Create a bidirectional stream
  const stream = await transport.createBidirectionalStream();
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();

  const initMessage = {
    messageType: 'init',
    eventCategory: 'active_member',
    contextId: boardId,
  };

  console.log('init with boardId: ', initMessage.contextId);
  await writer.write(new TextEncoder().encode(JSON.stringify(initMessage)));

  console.log('Warte auf Init Message');
  let data = await reader.read();
  console.log(new TextDecoder().decode(data.value));

  console.log('Warte auf Async Message');
  for (let i = 0; i < 2; i++) {
    data = await reader.read();
    console.log(new TextDecoder().decode(data.value));
  }

  transport.close();
}

async function testClientMessage() {
  // Create a WebTransport instance connecting to the Rust server
  const certificateArray = new Uint8Array(certificate);
  console.log('Starte WebTransport...');
  let transport = new WebTransport('https://[::1]:3031', {
    serverCertificateHashes: [{ algorithm: 'sha-256', value: certificateArray.buffer }],
  });
  await transport.ready;

  // Create a bidirectional stream
  const stream = await transport.createBidirectionalStream();
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();

  const initMessage = {
    messageType: 'init',
    eventCategory: 'client',
    contextId: boardId,
  };

  console.log('init with clientId: ', initMessage.clientId);
  await writer.write(new TextEncoder().encode(JSON.stringify(initMessage)));

  console.log('Warte auf Init Message');
  let data = await reader.read();
  console.log(new TextDecoder().decode(data.value));

  console.log('Warte auf Async Message');
  for (let i = 0; i < 2; i++) {
    data = await reader.read();
    console.log(new TextDecoder().decode(data.value));
  }

  transport.close();
}

async function testWebSocket() {
  const testFunction = async (index) => {
    const socket = new WebSocket('https://echo.websocket.org/');
    socket.onmessage = (message) => {
      console.log('New Message: ', message);
    };
    setTimeout(() => {
      socket.send('Hallo i bims aus: ', index);
      console.log(`Message ${index} sent!`);
    }, 1000);
  };

  for (let i = 0; i < 20; i++) {
    testFunction(i);
  }

  console.log('Test WebSokcet ended');
}
