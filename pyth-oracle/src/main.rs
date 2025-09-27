pub mod settings;
use alloy::{
    hex::FromHex,
    network::EthereumWallet,
    primitives::FixedBytes,
    providers::{Provider, ProviderBuilder},
    signers::local::PrivateKeySigner,
    sol,
};
use tracing::info;
use url::Url;

use crate::settings::Settings;

sol! {
    #[sol(rpc)]
    PythOracle,
    "abi/oracle.json",
}

const SETTINGS_FILE: &str = "Settings.toml";

#[tokio::main]
async fn main() {
    let _ = tracing_subscriber::fmt().try_init();
    let settings = Settings::from_toml(SETTINGS_FILE);

    let url = Url::parse(&settings.rpc_url).expect("Invalid RPC URL");

    let signer = PrivateKeySigner::from_bytes(
        &FixedBytes::from_hex(settings.private_key).expect("Invalid executor private key"),
    )
    .unwrap();

    let signer_address = signer.address();

    info!("Signer address: {}", signer_address);

    let wallet = EthereumWallet::from(signer.clone());

    let provider = ProviderBuilder::new()
        .disable_recommended_fillers()
        .with_gas_estimation()
        .with_simple_nonce_management()
        .fetch_chain_id()
        .wallet(wallet)
        .connect_http(url);

    match provider.get_chain_id().await {
        Ok(chain_id) => {
            info!("Chain ID: {}", chain_id);
        }
        Err(e) => {
            tracing::error!("Failed to get chain ID: {}", e);
        }
    }
}
