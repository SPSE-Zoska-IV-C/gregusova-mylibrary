import os
from datetime import date, datetime, timedelta
from random import Random

from werkzeug.security import generate_password_hash

from models import db, User, Book, PageLog
from main import app, get_cover_designs


def pick_any_cover() -> str:
    """Pick any existing cover image from static/img/book_covers.
    Falls back to preview from get_cover_designs(). If none found, returns
    a simple placeholder path that won't break the app.
    """
    try:
        designs = get_cover_designs()
        for d in designs:
            preview = d.get('preview')
            if preview:
                return preview
    except Exception:
        pass

    base_dir = os.path.join(app.static_folder or 'static', 'img', 'book_covers')
    for root, _, files in os.walk(base_dir):
        for f in files:
            if '.' in f and f.rsplit('.', 1)[1].lower() in app.config.get('ALLOWED_EXTENSIONS', {'png', 'jpg', 'jpeg', 'gif'}):
                rel = os.path.relpath(os.path.join(root, f), app.static_folder)
                return rel.replace('\\', '/')

    # Last resort: a stable placeholder path (may render as broken image but safe)
    return 'img/book_covers/book_1/placeholder.png'


def ensure_user(email: str, username: str, password: str) -> User:
    user = User.query.filter((User.email == email) | (User.username == username)).first()
    if user:
        return user
    user = User(
        email=email,
        username=username,
        password_hash=generate_password_hash(password),
    )
    db.session.add(user)
    db.session.commit()
    return user


def seed_books(user: User, rng: Random) -> list[Book]:
    """Create a few books for the user with mixed statuses and dates."""
    examples = [
        {
            'title': 'The Starlit Path',
            'author': 'A. Nightfall',
            'genre': 'Fiction, Fantasy',
            'pages': 360,
            'status': 'Already Read',
        },
        {
            'title': 'Systems Thinking 101',
            'author': 'E. Meadows',
            'genre': 'Non-fiction, Self-help',
            'pages': 240,
            'status': 'Reading Now',
        },
        {
            'title': 'Echoes of Time',
            'author': 'L. Chronos',
            'genre': 'Science Fiction, Dystopian',
            'pages': 420,
            'status': 'Already Read',
        },
        {
            'title': 'Whispers in the Fog',
            'author': 'M. Gray',
            'genre': 'Mystery / Crime, Thriller / Suspense',
            'pages': 310,
            'status': 'Already Read',
        },
        {
            'title': 'Old Roads, New Stories',
            'author': 'H. Velasquez',
            'genre': 'Historical, Romance',
            'pages': 280,
            'status': 'Reading Now',
        },
        {
            'title': 'The Art of Stillness',
            'author': 'P. Koenig',
            'genre': 'Essays',
            'pages': 195,
            'status': 'Want to Read',
        },
        {
            'title': 'Beneath the Willow Tree',
            'author': 'S. Harper',
            'genre': 'Drama, Coming-of-Age',
            'pages': 330,
            'status': 'Already Read',
        },
    ]

    cover = pick_any_cover()
    today = datetime.utcnow().date()
    current_year = today.year
    books: list[Book] = []

    for i, ex in enumerate(examples):
        start_month = rng.randint(1, 6)
        start_day = rng.choice([3, 7, 12, 18])
        start_dt = date(current_year, start_month, min(start_day, 28))

        finish_dt = None
        rating = None
        status = ex['status']
        if status.lower() in {'already read', 'finished'}:
            finish_month = rng.randint(max(start_month, 6), 12)
            finish_day = rng.choice([8, 14, 21, 26])
            finish_dt = date(current_year, finish_month, min(finish_day, 28))
            rating = rng.randint(3, 5)

        pages_read = ex['pages'] if finish_dt else rng.randint(20, ex['pages'] // 2)

        book = Book(
            user_id=user.id,
            title=ex['title'],
            author=ex['author'],
            genre=ex['genre'],
            pages=ex['pages'],
            cover=cover,
            status=status,
            notes='',
            rating=rating,
            pages_read=pages_read,
            start_date=start_dt,
            finish_date=finish_dt,
            retailer_link=None,
        )
        db.session.add(book)
        books.append(book)

    db.session.commit()
    return books


def clear_logs_for_year(user_id: int, year: int) -> None:
    """Remove existing PageLog entries for the given year to avoid duplication."""
    start = date(year, 1, 1)
    end = date(year + 1, 1, 1)
    PageLog.query.filter(
        PageLog.user_id == user_id,
        PageLog.log_date >= start,
        PageLog.log_date < end,
    ).delete(synchronize_session=False)
    db.session.commit()


def seed_logs_for_year(user: User, books: list[Book], rng: Random, year: int) -> None:
    """Create varying per-day page logs for the given year, but not in the future."""
    today = datetime.utcnow().date()
    for month in range(1, 13):
        # Skip months in the future
        if year == today.year and month > today.month:
            continue
        day_count = rng.randint(5, 10)
        days = rng.sample(list(range(1, 29)), k=day_count)
        base_pages = rng.randint(0, 94)
        for d in days:
            log_day = date(year, month, min(d, 28))
            if log_day > today:
                continue
            pages_val = min(160, base_pages + rng.randint(0, 25))
            b = books[rng.randint(0, len(books) - 1)] if books else None
            entry = PageLog(
                user_id=user.id,
                book_id=b.id if b else None,
                log_date=log_day,
                pages=pages_val,
            )
            db.session.add(entry)
    db.session.commit()



def main():
    rng = Random(42)  # Deterministic randomness for repeatable seeds
    with app.app_context():
        # Ensure tables exist
        db.create_all()

        user = ensure_user(email='seed@example.com', username='seeduser', password='Password123!')

        books = seed_books(user, rng)

        # Seed logs for the last 15 months up to today
        today = datetime.utcnow().date()
        months = 15
        start_year = (today.replace(day=1) - timedelta(days=months*31)).year
        start_month = (today.month - months + 12) % 12 or 12
        # Build a list of (year, month) tuples for the last 15 months
        ym_list = []
        y, m = today.year, today.month
        for _ in range(months):
            ym_list.append((y, m))
            m -= 1
            if m == 0:
                m = 12
                y -= 1
        ym_list = list(reversed(ym_list))

        # Clear logs for all these months' years
        cleared_years = set(y for y, _ in ym_list)
        for y in cleared_years:
            clear_logs_for_year(user.id, y)
        # Seed logs once per year (avoids duplicate daily entries)
        for y in sorted(cleared_years):
            seed_logs_for_year(user, books, rng, y)

        print(f"Seed complete: user={user.email}, books={len(books)}; logs for last {months} months created.")


if __name__ == '__main__':
    main()
