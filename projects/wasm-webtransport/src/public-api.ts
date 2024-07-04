/*
 * Public API Surface of wasm-webtransport
 */

import init from './lib/wasm-webtransport/pkg';
export { WebTransportClient, WebTransportSendStream, WebTransportTransport } from './lib/wasm-webtransport/pkg';
export { init as initWasm };
