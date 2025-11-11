from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()


class User(UserMixin, db.Model):
    __tablename__ = 'user'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    books = db.relationship('Book', backref='user', lazy=True, cascade='all, delete')


class Book(db.Model):
    __tablename__ = 'book'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    author = db.Column(db.String(150), nullable=False)
    genre = db.Column(db.String(120), nullable=False)
    pages = db.Column(db.Integer, nullable=False)
    cover = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(30), nullable=False, default='Reading Now')
    notes = db.Column(db.Text, nullable=True)
    rating = db.Column(db.Integer, nullable=True)
    pages_read = db.Column(db.Integer, nullable=False, default=0)
    start_date = db.Column(db.Date, nullable=True)
    finish_date = db.Column(db.Date, nullable=True)
