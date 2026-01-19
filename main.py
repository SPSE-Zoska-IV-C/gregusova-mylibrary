import os
from flask import Flask, render_template, request, redirect, url_for, flash
from werkzeug.utils import secure_filename
from models import db, Book, User, PageLog  # Import the single `db` instance and Book, User model
from datetime import datetime, date, timedelta
from uuid import uuid4
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from forms import SignupForm, LoginForm
from sqlalchemy import text
from collections import Counter
import re

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = 'your_secret_key'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///bookapp.db'  # Renamed to bookapp
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Ensure the upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize the database with the app
db.init_app(app)

# Flask-Login setup
login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# # Routes for Book App
# @app.route('/')
# @login_required
# def index():
#     # Get all books for the current user
#     books = Book.query.filter_by(user_id=current_user.id).all()
#     return render_template('index.html', books=books)

@app.route('/create', methods=['GET', 'POST'])
@login_required
def create():
    cover_designs = get_cover_designs()
    prefill_id = request.args.get('prefill_id') or request.form.get('source_want_id')
    prefill_book = None
    if prefill_id:
        prefill_book = Book.query.filter_by(id=prefill_id, user_id=current_user.id).first()
        if not prefill_book or (prefill_book.status or '').lower() != 'want to read':
            prefill_book = None
    if request.method == 'POST':
        try:
            # Get form data
            title = request.form['title']
            author = request.form['author']
            genre = request.form['genre']
            pages = int(request.form['pages'])
            cover = request.form.get('cover')
            retailer_link = request.form.get('retailer_link', '').strip() or None
            source_want_id = request.form.get('source_want_id')
            source_book = None
            if source_want_id:
                source_book = Book.query.filter_by(id=source_want_id, user_id=current_user.id).first()
                if not source_book or (source_book.status or '').lower() != 'want to read':
                    source_book = None
                elif not retailer_link:
                    retailer_link = source_book.retailer_link
                if source_book:
                    prefill_book = source_book
            
            # Determine status based on form input
            status = request.form.get('status', 'Reading Now')
            
            # Get optional fields
            notes = request.form.get('notes', '')
            rating = request.form.get('rating')
            pages_read = request.form.get('pages_read', 0)
            
            # Dates
            start_date_str = request.form.get('start_date')
            finish_date_str = request.form.get('finish_date')
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date() if start_date_str else None
            finish_date = datetime.strptime(finish_date_str, '%Y-%m-%d').date() if finish_date_str else None

            # Simple validation
            if not cover:
                flash('Please select a cover design and color variant.', 'error')
                return render_template('create.html', cover_designs=cover_designs, prefill_book=prefill_book)

            if cover == '__custom__':
                uploaded = request.files.get('custom_cover')
                if not uploaded or not uploaded.filename:
                    flash('Please upload a cover image.', 'error')
                    return render_template('create.html', cover_designs=cover_designs, prefill_book=prefill_book)
                if not allowed_file(uploaded.filename):
                    flash('Invalid file type. Please upload a PNG, JPG, JPEG, or GIF.', 'error')
                    return render_template('create.html', cover_designs=cover_designs, prefill_book=prefill_book)

                original_name = secure_filename(uploaded.filename)
                ext = os.path.splitext(original_name)[1].lower()
                unique_name = f"cover_{current_user.id}_{uuid4().hex}{ext}"
                save_path = os.path.join(app.root_path, app.config['UPLOAD_FOLDER'], unique_name)
                uploaded.save(save_path)

                # Store path relative to /static
                cover = f"uploads/{unique_name}"

            if status == 'Reading Now' and not start_date:
                flash('Please pick a start date.', 'error')
                return render_template('create.html', cover_designs=cover_designs, prefill_book=prefill_book)
            if status == 'Already Read' and (not start_date or not finish_date):
                flash('Please pick start and finish dates.', 'error')
                return render_template('create.html', cover_designs=cover_designs, prefill_book=prefill_book)

            # Convert rating to int if provided
            if rating:
                rating = int(rating)
            else:
                rating = None
                
            # Convert pages_read to int
            pages_read = int(pages_read) if pages_read else 0
            
            # Create new book instance
            new_book = Book(
                user_id=current_user.id,
                title=title,
                author=author,
                genre=genre,
                pages=pages,
                cover=cover,
                notes=notes,
                rating=rating,
                status=status,
                pages_read=pages_read,
                start_date=start_date,
                finish_date=finish_date,
                retailer_link=retailer_link
            )
            
            # Save to database
            db.session.add(new_book)
            if source_book:
                db.session.delete(source_book)
            db.session.commit()
            
            flash('Book added successfully!', 'success')
            return redirect(url_for('index'))
            
        except Exception as e:
            flash(f'Error adding book: {str(e)}', 'error')
            return render_template('create.html', cover_designs=cover_designs, prefill_book=prefill_book)
    
    return render_template('create.html', cover_designs=cover_designs, prefill_book=prefill_book)


def get_cover_designs():
    base_dir = os.path.join(app.static_folder, 'img', 'book_covers')
    cover_designs = []

    if not os.path.isdir(base_dir):
        return cover_designs

    for folder in sorted(os.listdir(base_dir)):
        folder_path = os.path.join(base_dir, folder)
        if not os.path.isdir(folder_path):
            continue

        files = sorted(
            [file for file in os.listdir(folder_path) if allowed_file(file)],
            key=lambda name: name.lower()
        )

        if not files:
            continue

        relative_dir = os.path.join('img', 'book_covers', folder).replace('\\', '/')
        variants = []
        for filename in files:
            variant_path = os.path.join(relative_dir, filename).replace('\\', '/')
            color_label = os.path.splitext(filename)[0].split('_')[-1]
            variants.append({
                'file': variant_path,
                'label': color_label
            })

        cover_designs.append({
            'id': folder,
            'name': folder.replace('_', ' ').title(),
            'preview': variants[0]['file'],
            'variants': variants
        })

    return cover_designs


def get_profile_pfps():
    pfp_dir = os.path.join(app.static_folder, 'img', 'pfp')
    if not os.path.isdir(pfp_dir):
        return []
    files = [f for f in os.listdir(pfp_dir) if allowed_file(f)]
    files.sort(key=lambda s: s.lower())
    return [os.path.join('img', 'pfp', f).replace('\\', '/') for f in files]


def get_avatar_unlock_milestones(total_books_read: int, total_pages_read: int):
    milestones = [
        {'key': 'books_10', 'label': '10 books read', 'achieved': total_books_read >= 10},
        {'key': 'books_5', 'label': '5 books read', 'achieved': total_books_read >= 5},
        {'key': 'books_15', 'label': '15 books read', 'achieved': total_books_read >= 15},
        {'key': 'books_20', 'label': '20 books read', 'achieved': total_books_read >= 20},
        {'key': 'pages_500', 'label': '500 pages read', 'achieved': total_pages_read >= 500},
        {'key': 'pages_2000', 'label': '2000 pages read', 'achieved': total_pages_read >= 2000},
        {'key': 'pages_5000', 'label': '5000 pages read', 'achieved': total_pages_read >= 5000},
        {'key': 'pages_7000', 'label': '7000 pages read', 'achieved': total_pages_read >= 7000},
    ]
    return milestones


def get_avatar_pfp_options(total_books_read: int, total_pages_read: int):
    pfps = get_profile_pfps()

    ALWAYS_UNLOCK_FIRST = 4

    rules = [
        None,  # pfp1 (always unlocked)
        None,  # pfp2 (always unlocked)
        None,  # pfp3 (always unlocked)
        None,  # pfp4 (always unlocked)
        ('books', 5, '5 books read'),
        ('books', 10, '10 books read'),
        ('books', 15, '15 books read'),
        ('books', 20, '20 books read'),
        ('pages', 500, '500 pages read'),
        ('pages', 2000, '2000 pages read'),
        ('pages', 5000, '5000 pages read'),
        ('pages', 7000, '7000 pages read'),
    ]

    options = []
    for idx, path in enumerate(pfps):
        if idx < ALWAYS_UNLOCK_FIRST:
            options.append({
                'path': path,
                'unlocked': True,
                'required_label': None,
            })
            continue

        rule = rules[idx] if idx < len(rules) else rules[-1]
        if rule is None:
            unlocked = True
            req_label = None
        else:
            kind, minimum, req_label = rule
            if kind == 'books':
                unlocked = total_books_read >= int(minimum)
            else:
                unlocked = total_pages_read >= int(minimum)

        options.append({
            'path': path,
            'unlocked': bool(unlocked),
            'required_label': req_label if not unlocked else None,
        })

    return options


def is_valid_hex_color(value: str) -> bool:
    if not value:
        return False
    return bool(re.fullmatch(r"#[0-9a-fA-F]{6}", value.strip()))

@app.route('/book/<int:book_id>')
@login_required
def book_detail(book_id):
    book = Book.query.get_or_404(book_id)
    if book.user_id != current_user.id:
        flash('Not authorized to view this book', 'error')
        return redirect(url_for('index'))
    return render_template('book_detail.html', book=book)


def log_pages_for_book(book: Book, pages_delta: int, log_date=None):
    """Persist a positive page delta for a specific day."""
    if not book:
        return
    try:
        pages_to_log = int(pages_delta or 0)
    except (TypeError, ValueError):
        return
    if pages_to_log <= 0:
        return

    log_day = log_date or datetime.utcnow().date()
    if isinstance(log_day, datetime):
        log_day = log_day.date()

    entry = PageLog(
        user_id=book.user_id,
        book_id=book.id,
        log_date=log_day,
        pages=pages_to_log
    )
    db.session.add(entry)


@app.route('/book/<int:book_id>/progress', methods=['POST'])
@login_required
def update_progress(book_id):
    book = Book.query.get_or_404(book_id)
    if book.user_id != current_user.id:
        flash('Not authorized to update this book', 'error')
        return redirect(url_for('mylist'))

    old_pages_read = int(book.pages_read or 0)

    if (book.status or '').lower() != 'reading now':
        flash('Progress can only be updated for books that are Reading Now.', 'error')
        return redirect(url_for('mylist'))

    pages_read_raw = request.form.get('pages_read', book.pages_read)
    notes = request.form.get('notes', '')
    finish_date_str = request.form.get('finish_date')
    mark_finished = request.form.get('mark_finished', 'false').lower() == 'true'
    rating_raw = request.form.get('rating')

    try:
        pages_read = int(pages_read_raw)
    except (TypeError, ValueError):
        flash('Please provide a valid number of pages read.', 'error')
        return redirect(url_for('mylist'))

    pages_read = max(0, min(pages_read, book.pages or pages_read))
    finish_date = None
    if finish_date_str:
        try:
            finish_date = datetime.strptime(finish_date_str, '%Y-%m-%d').date()
        except ValueError:
            flash('Finish date must be in YYYY-MM-DD format.', 'error')
            return redirect(url_for('mylist'))

    book.notes = notes.strip() if notes is not None else book.notes

    completed = False
    if book.pages and pages_read >= (book.pages or 0):
        completed = True
    if mark_finished:
        completed = True

    if completed:
        if book.pages:
            book.pages_read = book.pages
        else:
            book.pages_read = pages_read
        book.status = 'Already Read'
        book.finish_date = finish_date or datetime.utcnow().date()
        if rating_raw:
            try:
                rating_value = max(1, min(5, int(rating_raw)))
                book.rating = rating_value
            except (TypeError, ValueError):
                pass
    else:
        book.pages_read = pages_read
        book.status = 'Reading Now'
        if finish_date:
            book.finish_date = finish_date

    new_pages_read = int(book.pages_read or 0)
    pages_delta = new_pages_read - old_pages_read
    log_date = finish_date if completed and finish_date else datetime.utcnow().date()
    log_pages_for_book(book, pages_delta, log_date)

    try:
        db.session.commit()
        flash('Progress updated.', 'success')
    except Exception as exc:
        db.session.rollback()
        flash(f'Could not update progress: {exc}', 'error')

    return redirect(url_for('mylist'))

@app.route('/edit/<int:book_id>', methods=['GET', 'POST'])
@login_required
def edit_book(book_id):
    book = Book.query.get_or_404(book_id)
    if book.user_id != current_user.id:
        flash('Not authorized to edit this book', 'error')
        return redirect(url_for('index'))

    old_pages_read = int(book.pages_read or 0)
    
    if request.method == 'POST':
        try:
            # Update book fields
            book.title = request.form['title']
            book.author = request.form['author']
            book.genre = request.form['genre']
            book.pages = int(request.form['pages'])
            book.cover = request.form['cover']
            book.status = request.form.get('status', 'Reading Now')
            book.notes = request.form.get('notes', '')
            
            rating = request.form.get('rating')
            if rating:
                book.rating = int(rating)
            
            pages_read = request.form.get('pages_read', 0)
            book.pages_read = int(pages_read) if pages_read else 0
            
            new_pages_read = int(book.pages_read or 0)
            pages_delta = new_pages_read - old_pages_read
            log_pages_for_book(book, pages_delta, datetime.utcnow().date())

            db.session.commit()
            # Flash success message to user
            flash('Book updated successfully!', 'success')
            return redirect(url_for('book_detail', book_id=book.id))
            
        except Exception as e:
            flash(f'Error updating book: {str(e)}', 'error')
    
    return render_template('edit.html', book=book)

@app.route('/delete/<int:book_id>', methods=['POST'])
@login_required
def delete_book(book_id):
    book = Book.query.get_or_404(book_id)
    if book.user_id != current_user.id:
        flash('Not authorized to delete this book', 'error')
        return redirect(url_for('mylist'))
    
    was_wishlist = (book.status or '').lower() == 'want to read'
    
    try:
        db.session.delete(book)
        db.session.commit()
        flash('Book deleted successfully!', 'success')
    except Exception as e:
        flash(f'Error deleting book: {str(e)}', 'error')
    
    # Redirect back to the appropriate page
    if was_wishlist:
        return redirect(url_for('profile', tab='wishlist'))
    return redirect(url_for('mylist'))

@app.route('/book/<int:book_id>/change_status', methods=['POST'])
@login_required
def change_status(book_id):
    book = Book.query.get_or_404(book_id)
    if book.user_id != current_user.id:
        flash('Not authorized to modify this book', 'error')
        return redirect(url_for('mylist'))
    
    new_status = request.form.get('new_status')
    if new_status not in ['Reading Now', 'Want to Read', 'Already Read', 'Finished']:
        flash('Invalid status', 'error')
        return redirect(url_for('mylist'))
    
    old_status = book.status
    book.status = new_status
    
    try:
        db.session.commit()
        flash(f'Status changed to "{new_status}"', 'success')
    except Exception as e:
        flash(f'Error changing status: {str(e)}', 'error')
    
    # Redirect to appropriate page
    if (old_status or '').lower() == 'want to read' or new_status.lower() == 'want to read':
        return redirect(url_for('profile', tab='wishlist'))
    return redirect(url_for('mylist'))

@app.route('/reading')
@login_required
def reading():
    books = Book.query.filter_by(status='Reading Now', user_id=current_user.id).all()
    return render_template('reading.html', books=books)

@app.route('/want_to_read', methods=['GET', 'POST'])
@login_required
def want_to_read():
    # Wishlist is embedded in the Profile page. Keep this endpoint only for compatibility:
    # - GET redirects to Profile (Wishlist tab)
    # - POST still creates wishlist entries then redirects back to Profile
    books = Book.query.filter_by(status='Want to Read', user_id=current_user.id).order_by(Book.title.asc()).all()

    if request.method == 'GET':
        return redirect(url_for('profile', tab='wishlist'))

    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        author = request.form.get('author', '').strip()
        genre = request.form.get('genre', '').strip() or 'Unknown'
        pages_raw = request.form.get('pages', '0').strip()
        notes = request.form.get('notes', '').strip()
        retailer_link = request.form.get('retailer_link', '').strip() or None
        cover = request.form.get('cover') or 'img/book0.png'

        if not title or not author:
            flash('Title and Author are required.', 'error')
            return redirect(url_for('profile', tab='wishlist'))

        try:
            pages = int(pages_raw) if pages_raw else 0
        except ValueError:
            pages = 0

        pages = max(0, pages)

        new_book = Book(
            user_id=current_user.id,
            title=title,
            author=author,
            genre=genre,
            pages=pages,
            cover=cover,
            status='Want to Read',
            notes=notes,
            pages_read=0,
            retailer_link=retailer_link
        )

        try:
            db.session.add(new_book)
            db.session.commit()
            flash('Book saved to Want to Read.', 'success')
            return redirect(url_for('profile', tab='wishlist'))
        except Exception as exc:
            db.session.rollback()
            flash(f'Could not save book: {exc}', 'error')
            return redirect(url_for('profile', tab='wishlist'))

@app.route('/finished')
@login_required
def finished():
    books = Book.query.filter_by(status='Finished', user_id=current_user.id).all()
    return render_template('finished.html', books=books)


@app.route('/', endpoint='index')
@app.route('/mylist')
@login_required
def mylist():
    status_filter = request.args.get('status', 'all').strip()
    genre_filter = request.args.get('genre', 'all').strip()
    sort_option = request.args.get('sort', 'title').strip()
    search_query = request.args.get('q', '').strip()

    # Exclude "Want to Read" books from My Library - they belong in the wishlist
    query = Book.query.filter(
        Book.user_id == current_user.id,
        Book.status != 'Want to Read'
    )

    # Filter by status
    if status_filter and status_filter.lower() != 'all':
        query = query.filter(Book.status.ilike(status_filter))

    # Filter by genre
    if genre_filter and genre_filter.lower() != 'all':
        query = query.filter(Book.genre.ilike(genre_filter))

    # Search by title or author
    if search_query:
        like = f"%{search_query}%"
        query = query.filter((Book.title.ilike(like)) | (Book.author.ilike(like)))

    # Sorting
    if sort_option == 'rating':
        query = query.order_by(Book.rating.desc().nullslast(), Book.title.collate('NOCASE').asc())
    elif sort_option == 'rating_asc':
        query = query.order_by(Book.rating.asc().nullslast(), Book.title.collate('NOCASE').asc())
    elif sort_option == 'start_date':
        query = query.order_by(Book.start_date.desc().nullslast(), Book.title.collate('NOCASE').asc())
    elif sort_option == 'start_date_asc':
        query = query.order_by(Book.start_date.asc().nullslast(), Book.title.collate('NOCASE').asc())
    elif sort_option == 'author':
        query = query.order_by(Book.author.collate('NOCASE').asc(), Book.title.collate('NOCASE').asc())
    elif sort_option == 'author_desc':
        query = query.order_by(Book.author.collate('NOCASE').desc(), Book.title.collate('NOCASE').asc())
    elif sort_option == 'title_desc':
        query = query.order_by(Book.title.collate('NOCASE').desc())
    else:  # default: title
        query = query.order_by(Book.title.collate('NOCASE').asc())

    books = query.all()

    # Get unique genres for filter dropdown (exclude Want to Read books)
    all_genres = db.session.query(Book.genre).filter(
        Book.user_id == current_user.id,
        Book.genre.isnot(None),
        Book.genre != '',
        Book.status != 'Want to Read'
    ).distinct().order_by(Book.genre.asc()).all()
    genres = [g[0] for g in all_genres if g[0]]

    has_filters = bool(search_query or status_filter.lower() != 'all' or genre_filter.lower() != 'all' or sort_option != 'title')
    filter_meta = {
        'status': status_filter,
        'genre': genre_filter,
        'sort': sort_option,
        'q': search_query,
        'statuses': ['all', 'Reading Now', 'Want to Read', 'Already Read', 'Finished'],
        'genres': genres,
        'dirty': has_filters
    }

    return render_template('mylist.html', books=books, filters=filter_meta)


@app.route('/profile')
@login_required
def profile():
    def is_completed(status):
        return (status or '').lower() in {'already read', 'finished'}
    
    def effective_pages_read(book: Book) -> int:
        pages_total = int(book.pages or 0)
        pages_read = int(book.pages_read or 0)
        if pages_total > 0:
            pages_read = max(0, min(pages_read, pages_total))
            if is_completed(book.status) and pages_read == 0:
                return pages_total
        return max(0, pages_read)
    
    # Get currently reading books
    reading_now = Book.query.filter_by(
        status='Reading Now',
        user_id=current_user.id
    ).order_by(Book.start_date.desc().nullslast()).all()
    
    # Get already read books
    already_read = Book.query.filter(
        Book.user_id == current_user.id,
        Book.status.in_(['Already Read', 'Finished'])
    ).order_by(Book.finish_date.desc().nullslast()).all()

    # Wishlist books
    wishlist_books = Book.query.filter_by(
        status='Want to Read',
        user_id=current_user.id
    ).order_by(Book.title.asc()).all()
    
    # Calculate stats for Instagram-style display
    all_books = Book.query.filter(
        Book.user_id == current_user.id,
        Book.status != 'Want to Read'
    ).all()
    
    total_books_read = len([b for b in all_books if is_completed(b.status)])
    total_pages_read = sum(effective_pages_read(book) for book in all_books)

    pfp_options = get_avatar_pfp_options(total_books_read, total_pages_read)
    milestones = get_avatar_unlock_milestones(total_books_read, total_pages_read)
    
    return render_template('profile.html', 
                         reading_now=reading_now,
                         already_read=already_read,
                         wishlist_books=wishlist_books,
                         pfp_options=pfp_options,
                         avatar_milestones=milestones,
                         user=current_user,
                         total_books_read=total_books_read,
                         total_pages_read=total_pages_read)


@app.route('/profile/avatar', methods=['POST'])
@login_required
def profile_avatar():
    selected_pfp = (request.form.get('pfp') or '').strip()
    bg_color = (request.form.get('pfp_bg') or '').strip()

    # Recompute unlock state server-side to prevent selecting locked avatars
    all_books = Book.query.filter(
        Book.user_id == current_user.id,
        Book.status != 'Want to Read'
    ).all()
    total_books_read = len([b for b in all_books if (b.status or '').lower() in {'already read', 'finished'}])
    total_pages_read = db.session.query(db.func.sum(PageLog.pages)).filter(PageLog.user_id == current_user.id).scalar() or 0
    if not total_pages_read:
        total_pages_read = sum(max(0, int(b.pages_read or 0)) for b in all_books)

    pfp_options = get_avatar_pfp_options(int(total_books_read), int(total_pages_read))
    allowed_pfps = {opt['path'] for opt in pfp_options}
    unlocked_pfps = {opt['path'] for opt in pfp_options if opt['unlocked']}

    if selected_pfp not in allowed_pfps:
        flash('Please choose a valid profile picture.', 'error')
        return redirect(url_for('profile'))

    if selected_pfp not in unlocked_pfps:
        flash('That avatar is not unlocked yet.', 'error')
        return redirect(url_for('profile'))

    if bg_color and not is_valid_hex_color(bg_color):
        flash('Please choose a valid background color.', 'error')
        return redirect(url_for('profile'))

    current_user.profile_picture = selected_pfp
    current_user.profile_bg_color = bg_color or None
    try:
        db.session.commit()
        flash('Profile picture updated.', 'success')
    except Exception as exc:
        db.session.rollback()
        flash(f'Could not update profile picture: {exc}', 'error')

    return redirect(url_for('profile'))

@app.route('/stats')
@login_required
def stats():
    def is_completed(status):
        return (status or '').lower() in {'already read', 'finished'}

    def effective_pages_read(book: Book) -> int:
        pages_total = int(book.pages or 0)
        pages_read = int(book.pages_read or 0)
        if pages_total > 0:
            pages_read = max(0, min(pages_read, pages_total))
            if is_completed(book.status) and pages_read == 0:
                return pages_total
        return max(0, pages_read)

    today = datetime.utcnow().date()
    chart_year = today.year
    month_start = date(today.year, today.month, 1)
    next_month_start = date(today.year + 1, 1, 1) if today.month == 12 else date(today.year, today.month + 1, 1)
    prev_month_start = date(today.year - 1, 12, 1) if today.month == 1 else date(today.year, today.month - 1, 1)
    prev_month_end = month_start - timedelta(days=1)

    books = Book.query.filter(
        Book.user_id == current_user.id,
        Book.status != 'Want to Read'
    ).all()

    total_books = len(books)
    reading_now = [book for book in books if (book.status or '').lower() == 'reading now']
    completed = [book for book in books if is_completed(book.status)]

    pages_read_total = sum(effective_pages_read(book) for book in books)
    logged_pages_total = db.session.query(db.func.sum(PageLog.pages)).filter(PageLog.user_id == current_user.id).scalar() or 0
    if logged_pages_total:
        pages_read_total = int(logged_pages_total)

    ratings = [book.rating for book in completed if book.rating is not None]
    avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else None

    completed_this_year = [
        book for book in completed
        if book.finish_date is not None and book.finish_date.year == today.year
    ]

    # "Last best rated" = best rating, tie-breaker: latest finish date
    last_best_rated_book = None
    rated_completed = [book for book in completed if book.rating is not None]
    if rated_completed:
        best = max(
            rated_completed,
            key=lambda book: (
                int(book.rating or 0),
                book.finish_date or date.min,
                (book.title or '').lower(),
            )
        )
        last_best_rated_book = {
            'title': best.title,
            'author': best.author,
            'rating': best.rating,
            'finish_date': best.finish_date.strftime('%Y-%m-%d') if best.finish_date else None,
        }

    month_finished = [
        book for book in completed
        if book.finish_date is not None and month_start <= book.finish_date < next_month_start
    ]
    month_best_rated = [book for book in month_finished if book.rating is not None]
    best_book_month = None
    if month_best_rated:
        best = max(
            month_best_rated,
            key=lambda book: (int(book.rating or 0), book.finish_date or date.min, (book.title or '').lower())
        )
        best_book_month = {
            'title': best.title,
            'author': best.author,
            'rating': best.rating,
        }

    author_counter = Counter((book.author or '').strip() for book in completed if (book.author or '').strip())
    genre_counter = Counter((book.genre or '').strip() for book in completed if (book.genre or '').strip())

    top_author = author_counter.most_common(1)[0] if author_counter else None
    
    # Genre data for pie chart
    genre_data = []
    total_genre_books = sum(genre_counter.values())
    if total_genre_books > 0:
        for genre_name, count in genre_counter.most_common():
            percentage = round((count / total_genre_books) * 100, 1)
            genre_data.append({
                'name': genre_name,
                'count': count,
                'percentage': percentage
            })

    month_genres = Counter((book.genre or '').strip() for book in month_finished if (book.genre or '').strip())
    prev_month_finished = [
        book for book in completed
        if book.finish_date is not None and prev_month_start <= book.finish_date <= prev_month_end
    ]
    pages_prev_month = sum(effective_pages_read(book) for book in prev_month_finished)
    prev_month_genres = Counter((book.genre or '').strip() for book in prev_month_finished if (book.genre or '').strip())

    top_genre_month = None
    if month_genres:
        genre_name, count_now = month_genres.most_common(1)[0]
        count_prev = prev_month_genres.get(genre_name, 0)
        top_genre_month = {
            'genre': genre_name,
            'count': count_now,
            'prev_count': count_prev,
            'delta': count_now - count_prev,
        }

    # Pages read per month derived from per-day logs.
    monthly_pages = [0] * 12
    logs_this_year = PageLog.query.filter(
        PageLog.user_id == current_user.id,
        PageLog.log_date >= date(chart_year, 1, 1),
        PageLog.log_date < date(chart_year + 1, 1, 1)
    ).all()
    for log in logs_this_year:
        if log.log_date:
            monthly_pages[log.log_date.month - 1] += int(log.pages or 0)

    monthly_logs_used = any(monthly_pages)

    max_month_pages = max(monthly_pages) if monthly_pages else 0
    month_labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    monthly_series = []
    for i in range(12):
        pages_value = int(monthly_pages[i])
        pct = int(round((pages_value / max_month_pages) * 100)) if max_month_pages else 0
        monthly_series.append({
            'label': month_labels[i],
            'pages': pages_value,
            'pct': pct,
            'is_max': (max_month_pages > 0 and pages_value == max_month_pages),
        })

    pages_read_this_month = monthly_pages[today.month - 1] if today.year == chart_year else 0

    # Daily pages read for current month based on logs.
    days_in_month = (next_month_start - month_start).days
    daily_pages: dict[int, float] = {day: 0.0 for day in range(1, days_in_month + 1)}

    logs_this_month = PageLog.query.filter(
        PageLog.user_id == current_user.id,
        PageLog.log_date >= month_start,
        PageLog.log_date < next_month_start
    ).all()
    for log in logs_this_month:
        if log.log_date and month_start <= log.log_date < next_month_start:
            daily_pages[log.log_date.day] += float(log.pages or 0)

    daily_logs_used = any(value > 0 for value in daily_pages.values())

    daily_series = []
    max_daily_pages = max(daily_pages.values()) if daily_pages else 0.0
    for day in range(1, days_in_month + 1):
        pages_float = float(daily_pages.get(day, 0.0))
        pages_value = int(round(pages_float))
        pct = int(round((pages_float / max_daily_pages) * 100)) if max_daily_pages else 0
        daily_series.append({
            'day': day,
            'pages': pages_value,
            'pct': pct,
        })

    stats_payload = {
        'total_books': total_books,
        'reading_now': len(reading_now),
        'completed_total': len(completed),
        'completed_this_year': len(completed_this_year),
        'pages_read_total': pages_read_total,
        'pages_read_this_month': pages_read_this_month,
        'pages_prev_month': pages_prev_month,
        'pages_delta': pages_read_this_month - pages_prev_month,
        'avg_rating': avg_rating,
        'last_best_rated_book': last_best_rated_book,
        'best_book_month': best_book_month,
        'top_author': top_author,
        'genre_data': genre_data,
        'top_genre_month': top_genre_month,
        'month_label': today.strftime('%B %Y'),
        'prev_month_label': prev_month_start.strftime('%B %Y'),
        'chart_year': chart_year,
        'monthly': monthly_series,
        'monthly_logs_used': bool(monthly_logs_used),
        'monthly_max_pages': int(max_month_pages),
        'daily': daily_series,
        'daily_logs_used': bool(daily_logs_used),
        'daily_max_pages': int(round(max_daily_pages)),
        'days_in_month': days_in_month,
    }

    return render_template('stats.html', stats=stats_payload)


# Auth routes
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    form = SignupForm()
    if form.validate_on_submit():
        # Check if email/username exists
        if User.query.filter((User.email == form.email.data) | (User.username == form.username.data)).first():
            flash('Email or username already exists', 'error')
            return render_template('signup.html', form=form)

        hashed = generate_password_hash(form.password.data)
        user = User(email=form.email.data, username=form.username.data, password_hash=hashed)
        db.session.add(user)
        db.session.commit()
        flash('Account created. Please log in.', 'success')
        return redirect(url_for('login'))
    return render_template('signup.html', form=form)


@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and check_password_hash(user.password_hash, form.password.data):
            login_user(user, remember=form.remember.data)
            flash('Logged in successfully', 'success')
            next_page = request.args.get('next')
            return redirect(next_page or url_for('index'))
        else:
            flash('Invalid email or password', 'error')
    return render_template('login.html', form=form)


@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Logged out', 'success')
    return redirect(url_for('login'))

# Helper Function
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def ensure_retailer_link_column():
    try:
        result = db.session.execute(text("PRAGMA table_info(book)"))
        columns = {row[1] for row in result}
        if 'retailer_link' not in columns:
            db.session.execute(text("ALTER TABLE book ADD COLUMN retailer_link VARCHAR(255)"))
            db.session.commit()
    except Exception as exc:
        app.logger.warning('Could not ensure retailer_link column: %s', exc)


def ensure_profile_bg_color_column():
    try:
        result = db.session.execute(text("PRAGMA table_info(user)"))
        columns = {row[1] for row in result}
        if 'profile_bg_color' not in columns:
            db.session.execute(text("ALTER TABLE user ADD COLUMN profile_bg_color VARCHAR(32)"))
            db.session.commit()
    except Exception as exc:
        app.logger.warning('Could not ensure profile_bg_color column: %s', exc)

# Create tables before the first request
with app.app_context():
    db.create_all()
    ensure_retailer_link_column()
    # Ensure profile_picture column exists
    try:
        result = db.session.execute(text("PRAGMA table_info(user)"))
        columns = {row[1] for row in result}
        if 'profile_picture' not in columns:
            db.session.execute(text("ALTER TABLE user ADD COLUMN profile_picture VARCHAR(255)"))
            db.session.commit()
    except Exception as exc:
        app.logger.warning('Could not ensure profile_picture column: %s', exc)

    ensure_profile_bg_color_column()

if __name__ == '__main__':
    app.run(debug=True)
