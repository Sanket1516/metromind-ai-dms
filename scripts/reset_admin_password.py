import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from database import DatabaseManager, User, UserStatus


def main() -> int:
    target_email = "admin@kmrl.gov.in"
    new_password = "Admin123"

    dbm = DatabaseManager()
    with dbm.get_session() as db:
        user = db.query(User).filter(User.email == target_email).first()
        if not user:
            print(f"Admin user not found: {target_email}")
            return 1
        user.set_password(new_password)
        # Ensure account is active and unlocked
        user.status = UserStatus.ACTIVE
        user.login_attempts = 0
        user.locked_until = None
        db.commit()
        print(f"Reset password for {target_email} -> {new_password}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
