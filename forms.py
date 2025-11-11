from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SubmitField, IntegerField, SelectField, RadioField, HiddenField, PasswordField, BooleanField
from wtforms.validators import DataRequired, NumberRange, Optional, Email, EqualTo, Length

class BookForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired()])
    author = TextAreaField('Author', validators=[DataRequired()])
    genre = TextAreaField('Genre', validators=[DataRequired()])
    pages = IntegerField('Number of Pages', validators=[DataRequired(), NumberRange(min=1)])
    cover = RadioField('Choose a Cover Design', 
                      choices=[('img/book0.png', 'Cover 1'), ('img/book00.png', 'Cover 2')],
                      validators=[DataRequired()])
    status = HiddenField('Status', default='Reading Now')
    pages_read = IntegerField('Pages Read', validators=[Optional(), NumberRange(min=0)], default=0)
    notes = TextAreaField('Notes', validators=[Optional()])
    rating = HiddenField('Rating', validators=[Optional()])
    submit = SubmitField('Submit')

# Keep the old form for backward compatibility if needed
class ArticleForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired()])
    content = TextAreaField('Content', validators=[DataRequired()])
    submit = SubmitField('Submit')


class SignupForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    username = StringField('Username', validators=[DataRequired(), Length(min=3, max=80)])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password', message='Passwords must match')])
    submit = SubmitField('Create account')


class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember = BooleanField('Remember me')
    submit = SubmitField('Log in')
