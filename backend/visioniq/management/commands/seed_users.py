import os

import bcrypt
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = "Create configured administrator accounts without changing existing users."

    def handle(self, *args, **options):
        created = 0
        for index in (1, 2):
            username = os.getenv(f"ADMIN{index}_USERNAME", "").strip()
            email = os.getenv(f"ADMIN{index}_EMAIL", "").strip()
            password = os.getenv(f"ADMIN{index}_PASSWORD", "")
            if not username and not email and not password:
                continue
            if not username or not email or not password or password.startswith("change_this_"):
                self.stderr.write(f"ADMIN{index} is incomplete or still uses the example password; skipped.")
                continue
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT id FROM users WHERE LOWER(username) = LOWER(%s) OR LOWER(email) = LOWER(%s) LIMIT 1",
                    [username, email],
                )
                if cursor.fetchone():
                    self.stdout.write(f"Administrator {username} already exists; left unchanged.")
                    continue
                hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("ascii")
                cursor.execute(
                    "INSERT INTO users (username, email, password, role) VALUES (%s, %s, %s, %s)",
                    [username, email, hashed_password, "admin"],
                )
                created += 1
        self.stdout.write(self.style.SUCCESS(f"Created {created} administrator account(s)."))
