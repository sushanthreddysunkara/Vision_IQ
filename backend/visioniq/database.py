from datetime import date, datetime
from decimal import Decimal

from django.db import DatabaseError, connection


class DatabaseUnavailable(Exception):
    pass


def _json_value(value):
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return value


def fetch_all(sql, params=()):
    try:
        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            columns = [column[0] for column in cursor.description or ()]
            return [
                {key: _json_value(value) for key, value in zip(columns, row)}
                for row in cursor.fetchall()
            ]
    except DatabaseError as error:
        raise DatabaseUnavailable("The configured MySQL database is unavailable or its schema is incomplete.") from error


def fetch_one(sql, params=()):
    rows = fetch_all(sql, params)
    return rows[0] if rows else None
