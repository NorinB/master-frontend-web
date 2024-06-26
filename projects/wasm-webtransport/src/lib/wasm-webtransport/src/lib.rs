use serde::{Deserialize, Serialize};
use std::str::FromStr;
use std::sync::{Arc, Mutex};
use wasm_bindgen::prelude::*;
use web_sys::console;
use web_sys::js_sys::{Array, JsString, Promise};
use xwt_core::prelude::*;
use xwt_web_sys::{
    CertificateHash, Endpoint, HashAlgorithm, SendStream, Session, WebTransportOptions,
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
    client_send_stream: Option<Arc<Mutex<SendStream>>>,
    board_send_stream: Option<Arc<Mutex<SendStream>>>,
    element_send_stream: Option<Arc<Mutex<SendStream>>>,
    active_member_send_stream: Option<Arc<Mutex<SendStream>>>,
}

#[wasm_bindgen]
impl WebTransportClient {
    #[wasm_bindgen(constructor)]
    pub fn new(url: String, certificate_bytes: Vec<u8>) -> Self {
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
            client_send_stream: None,
            board_send_stream: None,
            element_send_stream: None,
            active_member_send_stream: None,
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

    pub async fn connect_to_context(
        &mut self,
        event_category: String,
        context_id: String,
        callback: &js_sys::Function,
        this_context: &JsValue,
    ) -> Result<(), JsError> {
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

        let send_stream_arc = Some(Arc::new(Mutex::new(send)));
        match event_category.as_str() {
            "client" => {
                self.client_send_stream = send_stream_arc;
            }
            "activeMember" => {
                self.board_send_stream = send_stream_arc;
            }
            "element" => {
                self.element_send_stream = send_stream_arc;
            }
            _ => {
                self.board_send_stream = send_stream_arc;
            }
        };
        loop {
            let message_length = match read.read(&mut buffer).await {
                Ok(bytes_read) => match bytes_read {
                    Some(bytes_read) => bytes_read,
                    None => {
                        return Err(JsError::new("Nachricht hat keine Länge"));
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
            let _ = callback.call1(this_context, message);
            console::log(&Array::of1(message));
        }
    }

    pub async fn send_client_message(&self, message: String) -> Result<(), JsError> {
        match &self.client_send_stream {
            Some(send_stream_mutex) => match send_stream_mutex.lock() {
                Ok(mut send_stream) => match send_stream.write(message.as_bytes()).await {
                    Ok(_) => Ok(()),
                    Err(_) => Err(JsError::new("Konnte Clientnachricht nicht schicken")),
                },
                Err(_) => Err(JsError::new("Konnte Clientstream nicht holen")),
            },
            None => Err(JsError::new(
                "WebTransportverbindung wurde bereits geschlossen",
            )),
        }
    }

    pub async fn send_board_message(&self, message: String) -> Result<(), JsError> {
        match &self.board_send_stream {
            Some(send_stream_mutex) => match send_stream_mutex.lock() {
                Ok(mut send_stream) => match send_stream.write(message.as_bytes()).await {
                    Ok(_) => Ok(()),
                    Err(_) => Err(JsError::new("Konnte Boardnachricht nicht schicken")),
                },
                Err(_) => Err(JsError::new("Konnte Boardstream nicht holen")),
            },
            None => Err(JsError::new(
                "WebTransportverbindung wurde bereits geschlossen",
            )),
        }
    }

    pub async fn send_element_message(&self, message: String) -> Result<(), JsError> {
        match &self.element_send_stream {
            Some(send_stream_mutex) => match send_stream_mutex.lock() {
                Ok(mut send_stream) => match send_stream.write(message.as_bytes()).await {
                    Ok(_) => Ok(()),
                    Err(_) => Err(JsError::new("Konnte Elementnachricht nicht schicken")),
                },
                Err(_) => Err(JsError::new("Konnte Elementstream nicht holen")),
            },
            None => Err(JsError::new(
                "WebTransportverbindung wurde bereits geschlossen",
            )),
        }
    }

    pub async fn send_active_member_message(&self, message: String) -> Result<(), JsError> {
        match &self.active_member_send_stream {
            Some(send_stream_mutex) => match send_stream_mutex.lock() {
                Ok(mut send_stream) => match send_stream.write(message.as_bytes()).await {
                    Ok(_) => Ok(()),
                    Err(_) => Err(JsError::new(
                        "Konnte Active-Member-Nachricht nicht schicken",
                    )),
                },
                Err(_) => Err(JsError::new("Konnte Active-Member-Stream nicht holen")),
            },
            None => Err(JsError::new(
                "WebTransportverbindung wurde bereits geschlossen",
            )),
        }
    }

    pub async fn close(&mut self) -> Result<(), JsError> {
        match &self.session {
            Some(session) => {
                session.transport.close();
                self.session = None;
                self.client_send_stream = None;
                self.board_send_stream = None;
                self.active_member_send_stream = None;
                self.element_send_stream = None;
                Ok(())
            }
            None => Err(JsError::new("Session not active")),
        }
    }

    pub async fn is_closed(&self) -> Result<Promise, JsError> {
        match &self.session {
            Some(session) => Ok(session.transport.closed()),
            None => Err(JsError::new("Session not active")),
        }
    }
}
