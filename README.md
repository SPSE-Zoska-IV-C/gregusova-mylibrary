# MyLibrary

Moderná webová aplikácia na správu osobnej knižnice: zaznamenávanie
pokroku v čítaní, hodnotenia, poznámky, wishlist „chcem čítať“ a
prehľad štatistík. Postavené na Flasku a SQLite, s čistým HTML/CSS a
ľahkým JavaScriptom.

## Funkcie
- Prihlásenie/registrácia (Flask-Login) a ochrana formulárov (Flask-WTF).
- Vytvorenie knihy s obálkou: predpripravené dizajny alebo vlastný upload
	(PNG/JPG/JPEG/GIF) s bezpečným názvom.
- Stavy knihy: „Reading Now“, „Already Read“, „Want to Read“.
- Záznam prečítaných strán (`PageLog`) a automatické logovanie pri
	dokončení.
- Poznámky a hodnotenie 1–5 pre prečítané knihy.
- Wishlist „Want to Read“ s možnosťou predvyplnenia pri vytvorení knihy
	a voliteľným `retailer_link`.
- Profil s avatarom (pfp) a odomykaním trofejí podľa počtu kníh/strán.
- Štatistiky: denný/mesačný prehľad a jednoduché vizualizácie bez
	externých knižníc.

## Tech stack
- Python 3.11, Flask
- Flask-Login, Flask-WTF, SQLAlchemy, SQLite
- WTForms, Werkzeug
- HTML5, CSS3, JavaScript (bez frameworkov)
- Grafika: vlastné ikony (ArtRage)


Poznámka pre uživateľa: pri vytváraní účtu a prihlasovaní sa zadáva email, ten však slúži iba ako unikátny identifikátor

1. Vytvorte a aktivujte virtuálne prostredie:
   
	 ```powershell
	 python -m venv .venv
	 .venv\Scripts\Activate
	 ```

2. Nainštalujte závislosti:
   
	 ```powershell
	 pip install -r requirements.txt
	 ```

3. Spustite aplikáciu (databáza sa vytvorí automaticky):
   
	 ```powershell
	 python main.py
	 # alebo
	 flask --app main run --debug
  	ak nefungujú, skúste:
  	 python-m flask --app main run --debug
	 ```

4. Otvorte http://localhost:5000 a prihláste sa/registrujte.

## Konfigurácia
- `SECRET_KEY`: tajný kľúč pre Flask (predvolené: `your_secret_key` v
	`main.py`). Odporúčame nastaviť vlastný cez environment:
  
	```powershell
	$env:SECRET_KEY = "<silny_tajny_kluc>"
	```
- Uploady obálok: `static/uploads`, povolené prípony: `png`, `jpg`,
	`jpeg`, `gif`.
- Databáza: `sqlite:///bookapp.db` (lokálny súbor). Úpravy schémy sú
	ošetrené pomocnými kontrolami stĺpcov pri štarte.

## Štruktúra projektu
- `main.py`: Flask aplikácia, routy, uploady, štatistiky, autentifikácia.
- `models.py`: SQLAlchemy modely (`User`, `Book`, `PageLog`).
- `forms.py`: `SignupForm`, `LoginForm` a validácie.
- `templates/`: HTML šablóny (login, signup, create, mylist, profile,
	stats, want_to_read, …).
- `static/`: CSS, JS a grafické súbory (obálky, ikony, pfp, uploads).
- `wsgi.py`: vstup pre produkčné nasadenie (WSGI server).
- `requirements.txt`: potrebne knižnice Pythonu.

## Nasadenie (prehľad)
- Produkčný WSGI server: napr. Waitress (Windows) alebo Gunicorn (Linux).
- Reverzný proxy: Nginx (HTTPS, statické súbory, kompresia).
- Odporúčané: `Flask-Talisman` pre bezpečnostné hlavičky, `Flask-Limiter`
	pre rate limiting, `Sentry` pre chybové reporty.

