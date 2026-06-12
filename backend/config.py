from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    ANTHROPIC_API_KEY: str = ""

    CIRCLE_API_KEY: str = ""
    CIRCLE_ENTITY_SECRET: str = ""
    CIRCLE_WALLET_SET_ID: str = ""
    CIRCLE_SIMULATE: bool = True

    ENVIRONMENT: str = "development"


settings = Settings()
