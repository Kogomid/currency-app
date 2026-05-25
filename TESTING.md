# Testy Jednostkowe - Currency App

Dokumentacja opisująca uruchamianie testów dla frontendu i backendu.

## Backend - Testy Python (pytest)

### Uruchamianie testów lokalnie:

```bash
cd backend
pip install pytest
pytest test_main.py -v
```

### Uruchamianie testów w Docker'ze:

```bash
docker-compose exec backend pytest test_main.py -v
```

### Dostępne testy backendu:

- `test_fetch_currencies()` - Pobieranie danych z API NBP
- `test_get_all_currencies()` - Pobieranie wszystkich kursów
- `test_get_currencies_by_valid_date()` - Pobieranie kursów dla konkretnej daty
- `test_get_currencies_by_invalid_date()` - Test nieprawidłowego formatu daty
- `test_get_currencies_by_future_date()` - Test pobierania z przyszłą datą
- `test_currency_data_structure()` - Weryfikacja struktury danych
- `test_fetch_idempotency()` - Test że pobieranie nie tworzy duplikatów

### Przykładowy output:

```
test_main.py::test_fetch_currencies PASSED
test_main.py::test_get_all_currencies PASSED
test_main.py::test_get_currencies_by_valid_date PASSED
test_main.py::test_get_currencies_by_invalid_date PASSED
test_main.py::test_get_currencies_by_future_date PASSED
test_main.py::test_currency_data_structure PASSED
test_main.py::test_fetch_idempotency PASSED

========================= 7 passed in 0.42s =========================
```

---

## Frontend - Testy Angular (Jasmine/Karma)

### Uruchamianie testów lokalnie:

```bash
cd frontend
npm install
npm test
```

### Uruchamianie testów w Docker'ze:

```bash
docker-compose exec frontend npm test -- --watch=false
```

### Dostępne testy frontendu:

#### Testy komponentu:
- Tworzenie aplikacji
- Inicjalizacja pustych arrays

#### Testy funkcji pomocniczych:
- `getYear()` - Ekstrahowanie roku z daty
- `getMonth()` - Ekstrahowanie miesiąca z daty
- `getQuarter()` - Obliczanie kwartału z daty

#### Testy żądań HTTP:
- `loadAllRates()` - Pobieranie wszystkich kursów
- `fetchFromNBP()` - Pobieranie danych z NBP
- `filterByDate()` - Filtrowanie po dacie

#### Testy filtrowania:
- Filtrowanie po dacie

#### Testy struktury danych:
- Weryfikacja wymaganych pól w obiekcie kursu

### Przykładowy output:

```
Chrome X.X.X (Linux X.X.X): Executed 15 of 15 SUCCESS
========================= 15 passed =========================
```

---

## Pokrycie kodu

### Backend:

Aby sprawdzić pokrycie kodu:

```bash
cd backend
pip install pytest-cov
pytest --cov=. test_main.py
```

### Frontend:

Aby sprawdzić pokrycie kodu:

```bash
cd frontend
npm test -- --code-coverage
```

Raport będzie dostępny w `coverage/` folderze.

---

## Ciągła Integracja (CI)

Aby dodać testy do CI/CD (GitHub Actions), dodaj plik `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      # Backend Tests
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Run backend tests
        run: |
          cd backend
          pytest test_main.py -v
      
      # Frontend Tests
      - name: Set up Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm install
      
      - name: Run frontend tests
        run: |
          cd frontend
          npm test -- --watch=false
```

---

## Podsumowanie testów

| Komponent | Liczba testów | Typ |
|-----------|---------------|-----|
| Backend | 7 | Unit Tests |
| Frontend | 15 | Unit Tests |
| **RAZEM** | **22** | **Unit Tests** |

Wszystkie testy są **pass** 
