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

    model_config = SettingsConfigDict(
        env_prefix="HEJ_",
        case_sensitive=False,
        env_file=".env",
        env_file_encoding="utf-8",
    )

    @computed_field
    @property
    def api_v1_prefix(self) -> str:
        return f"{self.api_prefix}/{self.api_version}"


settings = Settings()
