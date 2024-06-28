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
* @param {Function} callback
* @param {any} this_context
* @returns {Promise<void>}
*/
  connect_to_context(event_category: string, context_id: string, callback: Function, this_context: any): Promise<void>;
/**
* @param {string} message
* @returns {Promise<void>}
*/
  send_client_message(message: string): Promise<void>;
/**
* @param {string} message
* @returns {Promise<void>}
*/
  send_board_message(message: string): Promise<void>;
/**
* @param {string} message
* @returns {Promise<void>}
*/
  send_element_message(message: string): Promise<void>;
/**
* @param {string} message
* @returns {Promise<void>}
*/
  send_active_member_message(message: string): Promise<void>;
/**
* @returns {Promise<void>}
*/
  close(): Promise<void>;
/**
* @returns {Promise<Promise<any>>}
*/
  is_closed(): Promise<Promise<any>>;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_webtransportclient_free: (a: number) => void;
  readonly webtransportclient_new: (a: number, b: number, c: number, d: number) => number;
  readonly webtransportclient_init_session: (a: number) => number;
  readonly webtransportclient_connect_to_context: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly webtransportclient_send_client_message: (a: number, b: number, c: number) => number;
  readonly webtransportclient_send_board_message: (a: number, b: number, c: number) => number;
  readonly webtransportclient_send_element_message: (a: number, b: number, c: number) => number;
  readonly webtransportclient_send_active_member_message: (a: number, b: number, c: number) => number;
  readonly webtransportclient_close: (a: number) => number;
  readonly webtransportclient_is_closed: (a: number) => number;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly wasm_bindgen__convert__closures__invoke1_mut__h3a34ea36bf1d8b0a: (a: number, b: number, c: number) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly wasm_bindgen__convert__closures__invoke2_mut__h4c08c1e24b709fae: (a: number, b: number, c: number, d: number) => void;
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
