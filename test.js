async function testWebTransport() {
  // Create a WebTransport instance connecting to the Rust server
  console.log("Starte WebTransport...");
  const certificateArray = new Uint8Array([
    185, 147, 37, 47, 6, 78, 93, 118, 153, 201, 252, 17, 101, 177, 12, 226, 238,
    203, 189, 62, 45, 100, 97, 157, 25, 208, 42, 176, 75, 50, 98, 173,
  ]);
  console.log("Starte WebTransport...");
  let transport = new WebTransport("https://[::1]:3031", {
    serverCertificateHashes: [
      { algorithm: "sha-256", value: certificateArray.buffer },
    ],
  });
  await transport.ready;

  // Create a bidirectional stream
  const stream = await transport.createBidirectionalStream();
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();

  let testMessageJson = {
    message_type: "board_memberadd",
    boardId: "6654ef80584b12a4910e7f39",
    userId: "6654b896b687bac73d51e6da",
  };

  // Send data from the client to the server
  await writer.write(new TextEncoder().encode(JSON.stringify(testMessageJson)));

  // Read data reply from the server
  let data = await reader.read();
  console.log(new TextDecoder().decode(data.value));

  testMessageJson = {
    message_type: "board_memberremove",
    boardId: "6654ef80584b12a4910e7f39",
    userId: "6654b896b687bac73d51e6da",
  };

  // Send data from the client to the server
  await writer.write(new TextEncoder().encode(JSON.stringify(testMessageJson)));

  // Read data reply from the server
  data = await reader.read();
  console.log(new TextDecoder().decode(data.value));
}

// testWebTransport();
