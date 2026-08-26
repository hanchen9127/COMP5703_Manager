"""
Database Configuration
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool, StaticPool
import os

# SQLite configuration for the development environment.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./hej_dev.db")

is_sqlite = DATABASE_URL.startswith("sqlite")
is_memory_sqlite = DATABASE_URL in {"sqlite://", "sqlite:///:memory:"}

poolclass = None
if is_sqlite:
    poolclass = StaticPool if is_memory_sqlite else NullPool

# Engine configuration for SQLite.
engine = create_engine(
    DATABASE_URL,
    # SQLite-specific options.
    connect_args={"check_same_thread": False} if is_sqlite else {},
    poolclass=poolclass,
    # General options.
    echo=False,  # Set to True to view SQL statements.
)

if "sqlite" in DATABASE_URL:

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, _connection_record) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Session:
    """
    Get a database session.
    Used for dependency injection.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize the database by creating all tables.
    Called when the application starts.
    """
    from app.models.db_models import Base
    Base.metadata.create_all(bind=engine)
    migrate_db_schema()


def migrate_db_schema() -> None:
    """Apply additive schema changes for existing SQLite dev databases."""
    if "sqlite" not in DATABASE_URL:
        return

    from sqlalchemy import inspect, text

    inspector = inspect(engine)
    if "tasks" not in inspector.get_table_names():
        return

    existing = {column["name"] for column in inspector.get_columns("tasks")}
    statements: list[str] = []
    if "dispute_policy_ref" not in existing:
        statements.append(
            "ALTER TABLE tasks ADD COLUMN dispute_policy_ref VARCHAR(255)"
        )
    if "export_policy_ref" not in existing:
        statements.append("ALTER TABLE tasks ADD COLUMN export_policy_ref VARCHAR(255)")
    if "text_span_label_options" not in existing:
        statements.append("ALTER TABLE tasks ADD COLUMN text_span_label_options JSON")

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def reset_db():
    """
    Reset the database by dropping and recreating all tables.
    Intended for test environments only.
    """
    from app.models.db_models import Base
    Base.metadata.drop_all(bind=engine)
    init_db()
