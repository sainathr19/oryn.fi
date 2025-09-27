use config::{Config, ConfigError, Environment, File};

#[derive(serde::Deserialize, Debug)]
pub struct Settings {
    pub rpc_url: String,
    pub private_key: String,
}

impl Settings {
    pub fn from_toml(path: &str) -> Self {
        match Self::try_from_toml(path) {
            Ok(settings) => settings,
            Err(e) => {
                tracing::error!("Failed to load settings from {}: {}", path, e);
                panic!("Missing required configuration variables : {}", e);
            }
        }
    }

    fn try_from_toml(path: &str) -> Result<Self, ConfigError> {
        let config = Config::builder()
            .add_source(File::with_name(path))
            .add_source(Environment::with_prefix("REDEEMER").separator("_"))
            .build()?;
        config.try_deserialize()
    }
}
