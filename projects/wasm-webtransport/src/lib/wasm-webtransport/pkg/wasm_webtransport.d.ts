/* tslint:disable */
/* eslint-disable */
/**
*/
export class WebTransportClient {
  free(): void;
/**
* @param {string} url
* @param {Uint8Array} certificate_bytes
*/
  constructor(url: string, certificate_bytes: Uint8Array);
/**
* @returns {Promise<void>}
*/
  init_session(): Promise<void>;
/**
* @param {string} event_category
* @param {string} context_id
* @returns {Promise<WebTransportSendStream>}
*/
  setup_connection(event_category: string, context_id: string): Promise<WebTransportSendStream>;
/**
* @param {Function} board_callback
* @param {Function} element_callback
* @param {Function} active_member_callback
* @param {Function} client_callback
* @param {any} this_context
* @returns {Promise<void>}
*/
  connect_to_context(board_callback: Function, element_callback: Function, active_member_callback: Function, client_callback: Function, this_context: any): Promise<void>;
/**
* @returns {Promise<void>}
*/
  close(): Promise<void>;
/**
* @returns {Promise<any>}
*/
  is_closed(): Promise<any>;
}
/**
*/
export class WebTransportSendStream {
  free(): void;
/**
* @param {string} message
* @returns {Promise<void>}
*/
  send_message(message: string): Promise<void>;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_webtransportclient_free: (a: number) => void;
  readonly webtransportclient_new: (a: number, b: number, c: number, d: number) => number;
  readonly webtransportclient_init_session: (a: number) => number;
  readonly webtransportclient_setup_connection: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly webtransportclient_connect_to_context: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly webtransportclient_close: (a: number) => number;
  readonly webtransportclient_is_closed: (a: number) => number;
  readonly __wbg_webtransportsendstream_free: (a: number) => void;
  readonly webtransportsendstream_send_message: (a: number, b: number, c: number) => number;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly _dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__ha03ebee3e9611b53: (a: number, b: number, c: number) => void;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly wasm_bindgen__convert__closures__invoke2_mut__h17d19052343a1b0d: (a: number, b: number, c: number, d: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
