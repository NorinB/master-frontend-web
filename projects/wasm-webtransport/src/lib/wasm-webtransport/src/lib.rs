use serde::Serialize;
use wasm_bindgen::prelude::*;
use web_sys::console;
use xwt_core::prelude::*;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InitMessage {
    pub message_type: String,
    pub event_category: String,
    pub context_id: String,
}

#[cfg(feature = "web_sys_unstable_apis")]
#[wasm_bindgen]
pub async fn init_webtransport(
    url: String,
    certificate_bytes: Vec<u8>,
    event_category: String,
    context_id: String,
) -> Result<(), JsValue> {
    // let server_cert = xwt_cert_utils::digest::sha256(&certificate_bytes);

    use std::str::FromStr;
    use xwt_web_sys::{CertificateHash, WebTransportOptions};

    use rxrust::ops::buffer;
    use web_sys::js_sys::{Array, JsString};
    let options = xwt_web_sys::WebTransportOptions {
        server_certificate_hashes: vec![xwt_web_sys::CertificateHash {
            algorithm: xwt_web_sys::HashAlgorithm::Sha256,
            value: certificate_bytes,
        }],
        ..Default::default()
    };

    let endpoint = xwt_web_sys::Endpoint {
        options: options.to_js(),
    };

    let connecting = endpoint
        .connect(url.as_str())
        .await
        .expect("Endpoint unreachable");

    let session = connecting.wait_connect().await.unwrap();

    let opening = session.open_bi().await.unwrap();

    let (mut send, mut read) = opening.wait_bi().await.unwrap();

    send.write(
        serde_json::to_string(&InitMessage {
            message_type: "init".to_string(),
            event_category,
            context_id,
        })
        .unwrap()
        .as_bytes(),
    )
    .await
    .unwrap();

    let mut buffer = vec![0; 65536].into_boxed_slice();
    let Some(len) = read.read(&mut buffer).await.unwrap() else {
        return Err(JsValue::null());
    };
    let bytes = &buffer[..len];
    let message = core::str::from_utf8(bytes).unwrap();
    console::log(&Array::of1(&JsString::from_str(message).unwrap()));

    Ok(())
}
