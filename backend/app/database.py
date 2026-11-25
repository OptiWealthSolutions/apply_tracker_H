import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

# Local database file directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

DB_PATH = os.path.join(DATA_DIR, "market_finance_tracker.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_sqlite_schema():
    """Safely adds newly introduced columns to existing SQLite tables without losing data."""
    migrations = {
        "job_offers": [
            ("is_dismissed", "BOOLEAN DEFAULT 0"),
            ("ats_platform", "VARCHAR(50) DEFAULT 'direct'"),
            ("qwen_score", "FLOAT"),
            ("qwen_reasons", "TEXT"),
            ("hard_flags", "TEXT"),
            ("embedding_hash", "VARCHAR(64)"),
            ("embedding_blob", "BLOB"),
        ],
        "applications": [
            ("status_history", "TEXT"),
        ],
        "cv_documents": [
            ("variant", "VARCHAR(50) DEFAULT 'trading'"),
            ("label", "VARCHAR(150) DEFAULT 'CV A · Trading / Structuring / Sales'"),
        ],
    }
    with engine.begin() as conn:
        for table, cols in migrations.items():
            existing = {
                row[1]
                for row in conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
            }
            for col_name, col_type in cols:
                if col_name not in existing:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type}"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
