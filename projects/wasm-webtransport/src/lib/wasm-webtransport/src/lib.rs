use serde::{Deserialize, Serialize};
use std::borrow::BorrowMut;
use std::rc::Rc;
use std::str::FromStr;
use wasm_bindgen::prelude::*;
use web_sys::console;
use web_sys::js_sys::{Array, JsString};
use xwt_core::prelude::*;
use xwt_web_sys::{
    sys::WebTransport, CertificateHash, Endpoint, HashAlgorithm, RecvStream, SendStream, Session,
    WebTransportOptions,
};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InitMessage {
    pub message_type: String,
    pub event_category: String,
    pub context_id: String,
}

#[cfg(feature = "web_sys_unstable_apis")]
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerMessage {
    pub message_type: String,
    pub body: String,
}

#[wasm_bindgen]
pub struct WebTransportClient {
    session: Option<Session>,
    endpoint: Endpoint,
    url: String,
    client_read_stream: Option<RecvStream>,
    board_read_stream: Option<RecvStream>,
    element_read_stream: Option<RecvStream>,
    active_member_read_stream: Option<RecvStream>,
}

#[wasm_bindgen]
impl WebTransportClient {
    #[wasm_bindgen(constructor)]
    pub fn new(url: String, certificate_bytes: Vec<u8>) -> Self {
        console_error_panic_hook::set_once();

        let options = WebTransportOptions {
            server_certificate_hashes: vec![CertificateHash {
                algorithm: HashAlgorithm::Sha256,
                value: certificate_bytes,
            }],
            ..Default::default()
        };

        let endpoint = Endpoint {
            options: options.to_js(),
        };

        Self {
            session: None,
            endpoint,
            url,
            client_read_stream: None,
            board_read_stream: None,
            element_read_stream: None,
            active_member_read_stream: None,
        }
    }

    pub async fn init_session(&mut self) {
        let connecting = self
            .endpoint
            .connect(self.url.as_str())
            .await
            .expect("Endpoint unreachable");

        let session = connecting.wait_connect().await.unwrap();

        self.session = Some(session);
    }

    pub async fn setup_connection(
        &mut self,
        event_category: String,
        context_id: String,
    ) -> Result<WebTransportSendStream, JsError> {
        let opening = match &self.session {
            Some(session) => session.open_bi().await.unwrap(),
            None => return Err(JsError::new("Session not active")),
        };

        // hier mit match machen
        let (mut send, mut read) = opening.wait_bi().await.unwrap();

        send.write(
            serde_json::to_string(&InitMessage {
                message_type: "init".to_string(),
                event_category: event_category.clone(),
                context_id,
            })
            .unwrap()
            .as_bytes(),
        )
        .await
        .unwrap();

        let mut buffer = vec![0; 65536].into_boxed_slice();
        let init_response_length = match read.read(&mut buffer).await {
            Ok(bytes_read) => match bytes_read {
                Some(bytes_read) => bytes_read,
                None => {
                    return Err(JsError::new("Init Antwort hat keine Länge"));
                }
            },
            Err(_) => {
                return Err(JsError::new("Init Antwort konnte nicht gelesen werden"));
            }
        };
        let init_response_message = match std::str::from_utf8(&buffer[..init_response_length]) {
            Ok(message) => message,
            Err(_) => {
                return Err(JsError::new(
                    "Konnte Init-Antwort-Bytes nicht in String umwandeln",
                ));
            }
        };

        console::log(&Array::of1(
            &JsString::from_str(
                format!("Init response Message: {}", init_response_message).as_str(),
            )
            .unwrap(),
        ));

        match serde_json::from_str::<ServerMessage>(init_response_message) {
            Ok(init_message) => match init_message.message_type.as_str() {
                "success" => (),
                _ => return Err(JsError::new("")),
            },
            Err(_) => {
                return Err(JsError::new(
                    "Init-Antwort konnte nicht in ServerMessage umgewandelt werden",
                ))
            }
        }
        match event_category.as_str() {
            "board" => {
                self.board_read_stream = Some(read);
            }
            "element" => {
                self.element_read_stream = Some(read);
            }
            "active_member" => {
                self.active_member_read_stream = Some(read);
            }
            _ => {
                self.client_read_stream = Some(read);
            }
        };
        Ok(WebTransportSendStream { send_stream: send })
    }

    pub async fn get_transport(&self) -> Result<WebTransportTransport, JsError> {
        match &self.session {
            Some(session) => Ok(WebTransportTransport {
                transport: session.transport.clone(),
            }),
            None => Err(JsError::new("Session is not active")),
        }
    }

    pub async fn connect_to_context(
        &mut self,
        board_callback: &js_sys::Function,
        element_callback: &js_sys::Function,
        active_member_callback: &js_sys::Function,
        client_callback: &js_sys::Function,
        this_context: &JsValue,
    ) -> Result<(), JsError> {
        let board_read_stream: &mut RecvStream = match &mut self.board_read_stream {
            Some(read_stream) => read_stream,
            None => return Err(JsError::new("Board Read Stream existiert nicht")),
        };
        let element_read_stream: &mut RecvStream = match &mut self.element_read_stream {
            Some(read_stream) => read_stream,
            None => return Err(JsError::new("Element Read Stream existiert nicht")),
        };
        let active_member_read_stream: &mut RecvStream = match &mut self.active_member_read_stream {
            Some(read_stream) => read_stream,
            None => return Err(JsError::new("Active Member Read Stream existiert nicht")),
        };
        let client_read_stream: &mut RecvStream = match &mut self.client_read_stream {
            Some(read_stream) => read_stream,
            None => return Err(JsError::new("Client Read Stream existiert nicht")),
        };
        tokio::select! {
            _ = async {
                loop {
                    let mut buffer = vec![0; 65536].into_boxed_slice();
                    let message_length = match board_read_stream.read(&mut buffer).await {
                        Ok(bytes_read) => match bytes_read {
                            Some(bytes_read) => bytes_read,
                            None => {
                                return Err::<(), JsError>(JsError::new("Nachricht hat keine Länge"));
                            }
                        },
                        Err(_) => {
                            return Err(JsError::new("Nachricht konnte nicht gelesen werden"));
                        }
                    };
                    let message = match std::str::from_utf8(&buffer[..message_length]) {
                        Ok(message) => message,
                        Err(_) => {
                            return Err(JsError::new(
                                "Konnte Nachricht-Bytes nicht in String umwandeln",
                            ));
                        }
                    };

                    let message = &JsString::from_str(message).unwrap();
                    let _ = board_callback.call1(this_context, message);
                    console::log(&Array::of1(message));
                }
            } => {
                console::error(&Array::of1(
                    &JsString::from_str(
                        format!("Connection to Board Context Lost").as_str(),
                    )
                    .unwrap(),
                ));
            }
            _ = async {
                loop {
                    let mut buffer = vec![0; 65536].into_boxed_slice();
                    let message_length = match element_read_stream.read(&mut buffer).await {
                        Ok(bytes_read) => match bytes_read {
                            Some(bytes_read) => bytes_read,
                            None => {
                                return Err::<(), JsError>(JsError::new("Nachricht hat keine Länge"));
                            }
                        },
                        Err(_) => {
                            return Err(JsError::new("Nachricht konnte nicht gelesen werden"));
                        }
                    };
                    let message = match std::str::from_utf8(&buffer[..message_length]) {
                        Ok(message) => message,
                        Err(_) => {
                            return Err(JsError::new(
                                "Konnte Nachricht-Bytes nicht in String umwandeln",
                            ));
                        }
                    };

                    let message = &JsString::from_str(message).unwrap();
                    let _ = element_callback.call1(this_context, message);
                    console::log(&Array::of1(message));
                }
            } => {
                console::error(&Array::of1(
                    &JsString::from_str(
                        format!("Connection to Element Context Lost").as_str(),
                    )
                    .unwrap(),
                ));
            }
            _ = async {
                loop {
                    let mut buffer = vec![0; 65536].into_boxed_slice();
                    let message_length = match active_member_read_stream.read(&mut buffer).await {
                        Ok(bytes_read) => match bytes_read {
                            Some(bytes_read) => bytes_read,
                            None => {
                                return Err::<(), JsError>(JsError::new("Nachricht hat keine Länge"));
                            }
                        },
                        Err(_) => {
                            return Err(JsError::new("Nachricht konnte nicht gelesen werden"));
                        }
                    };
                    let message = match std::str::from_utf8(&buffer[..message_length]) {
                        Ok(message) => message,
                        Err(_) => {
                            return Err(JsError::new(
                                "Konnte Nachricht-Bytes nicht in String umwandeln",
                            ));
                        }
                    };

                    let message = &JsString::from_str(message).unwrap();
                    let _ = active_member_callback.call1(this_context, message);
                    console::log(&Array::of1(message));
                }
            } => {
                console::error(&Array::of1(
                    &JsString::from_str(
                        format!("Connection to Active Member Context Lost").as_str(),
                    )
                    .unwrap(),
                ));
            }
            _ = async {
                loop {
                    let mut buffer = vec![0; 65536].into_boxed_slice();
                    let message_length = match client_read_stream.read(&mut buffer).await {
                        Ok(bytes_read) => match bytes_read {
                            Some(bytes_read) => bytes_read,
                            None => {
                                return Err::<(), JsError>(JsError::new("Nachricht hat keine Länge"));
                            }
                        },
                        Err(_) => {
                            return Err(JsError::new("Nachricht konnte nicht gelesen werden"));
                        }
                    };
                    let message = match std::str::from_utf8(&buffer[..message_length]) {
                        Ok(message) => message,
                        Err(_) => {
                            return Err(JsError::new(
                                "Konnte Nachricht-Bytes nicht in String umwandeln",
                            ));
                        }
                    };

                    let message = &JsString::from_str(message).unwrap();
                    let _ = client_callback.call1(this_context, message);
                    console::log(&Array::of1(message));
                }
            } => {
                console::error(&Array::of1(
                    &JsString::from_str(
                        format!("Connection to Client Context Lost").as_str(),
                    )
                    .unwrap(),
                ));
            }
        }
        Ok(())
    }
}

#[wasm_bindgen]
pub struct WebTransportSendStream {
    send_stream: SendStream,
}

#[wasm_bindgen]
impl WebTransportSendStream {
    pub async fn send_message(&mut self, message: String) -> Result<(), JsError> {
        match self.send_stream.write(message.as_bytes()).await {
            Ok(_) => Ok(()),
            Err(_) => Err(JsError::new("WebTransportverbindung bereits geschlossen")),
        }
    }
}

#[wasm_bindgen]
pub struct WebTransportTransport {
    transport: Rc<WebTransport>,
}

#[wasm_bindgen]
impl WebTransportTransport {
    pub fn close(&mut self) {
        let _ = &self.transport.borrow_mut().close();
    }

    pub async fn is_closed(&mut self) -> Result<JsValue, JsError> {
        match wasm_bindgen_futures::JsFuture::from(self.transport.borrow_mut().closed()).await {
            Ok(closed) => Ok(closed),
            Err(_) => Err(JsError::new("Couldn't check, if transport is closed")),
        }
    }
}
