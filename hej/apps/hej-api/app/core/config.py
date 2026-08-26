from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "hej-api"
    app_version: str = "0.1.0"
    environment: str = "development"
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True
    api_prefix: str = "/api"
    api_version: str = "v1"
    gemini_enabled: bool = True
    gemini_api_key: str = "AQ.Ab8RN6IXjWaXAT0iK69qDXAetfh5BdLAxtxegws5b-jTPp2OvA"
    gemini_model: str = "gemini-2.5-flash"
    gemini_timeout_seconds: int = 20

    model_config = SettingsConfigDict(
        env_prefix="HEJ_",
        case_sensitive=False,
    )

    @computed_field
    @property
    def api_v1_prefix(self) -> str:
        return f"{self.api_prefix}/{self.api_version}"


settings = Settings()
