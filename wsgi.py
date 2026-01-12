"""WSGI entry point for deploying the Flask app on a production server."""
import os

os.environ.setdefault("FLASK_ENV", "production")

from main import app   # noqa: E402

application = app

if __name__ == "__main__":
    application.run()
