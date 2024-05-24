async function testWebTransport() {
  // Create a WebTransport instance connecting to the Rust server
  console.log("Starte WebTransport...");
  const certificateArray = new Uint8Array([
    235, 232, 85, 165, 168, 153, 92, 211, 226, 161, 139, 41, 97, 187, 104, 134,
    59, 230, 116, 30, 128, 213, 166, 220, 219, 229, 206, 151, 66, 138, 142, 107,
  ]);
  console.log("Starte WebTransport...");
  let transport = new WebTransport("https://[::1]:3031", {
    serverCertificateHashes: [
      { algorithm: "sha-256", value: certificateArray.buffer },
    ],
  });
  await transport.ready;

  // Create a bidirectional stream
  let stream = await transport.createBidirectionalStream();

  let testMessageJson = { message_type: "board_memberadded" };

  // Send data from the client to the server
  await stream.writable
    .getWriter()
    .write(new TextEncoder().encode(JSON.stringify(testMessageJson)));

  // Read data reply from the server
  let data = await stream.readable.getReader().read();
  console.log(new TextDecoder().decode(data.value));
}

// testWebTransport();
