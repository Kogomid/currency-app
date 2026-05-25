# Currency App

Aplikacja webowa do wyświetlania i zarządzania kursami walut z NBP.

## Funkcjonalności

**Pobieranie kursów walut** z API NBP za pomocą przycisku  
**Przechowywanie danych** w bazie PostgreSQL  
**Wyświetlanie w tabelach** z podziałem na lata, kwartały i miesiące  
**Filtrowanie po dacie** - wyszukaj kursy z wybranego dnia 
**Testy jednostkowe** - 22+ testy dla frontendu i backendu  
**Docker Compose** - uruchomienie jednym poleceniem  

---

## Szybki Start

### Wymagania:
- Docker & Docker Compose
- Git

### Uruchamianie:

```bash
# Klonuj projekt
git clone <repo>
cd currency-app

# Uruchom aplikację
docker-compose up

# Otwórz w przeglądarce
# Frontend: http://localhost:4200
# Backend API: http://localhost:8000
```

---

## Struktura Projektu

```
currency-app/
├── frontend/              # Angular
│   ├── src/
│   │   └── app/
│   │       ├── app.component.ts
│   │       ├── app.component.html
│   │       ├── app.component.css
│   │       └── app.component.spec.ts     # Testy Jasmine
│   ├── package.json
│   └── Dockerfile
│
├── backend/               # FastAPI serwer
│   ├── main.py           # API endpoints
│   ├── database.py       # ORM
│   ├── test_main.py      # Testy pytest
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml    # Konfiguracja serwisów
├── README.md            # Ten plik
└── TESTING.md           # Dokumentacja testów

```

---

## Technologia

### Frontend:
- **Angular 19** - Framework
- **TypeScript** - Język
- **RxJS** - Reactive Programming
- **Jasmine/Karma** - Testing Framework
- **Bootstrap CSS** - Styling

### Backend:
- **FastAPI** - Web Framework
- **Python 3.11** - Język
- **SQLAlchemy** - ORM
- **PostgreSQL** - Baza danych
- **pytest** - Testing Framework

### DevOps:
- **Docker** - Containerization
- **Docker Compose** - Orchestration
- **nginx** - Web Server (opcjonalnie)

---

## API Endpoints

### GET `/currencies`
Zwraca listę wszystkich kursów walut.

**Parametry:** Brak

**Odpowiedź:**
```json
[
  {
    "id": 1,
    "code": "USD",
    "currency": "Dolar Amerykański",
    "rate": 4.15,
    "effective_date": "2026-05-25"
  },
  ...
]
```

---

### GET `/currencies/{date}`
Zwraca kursy walut z konkretnej daty.

**Parametry:**
- `date` (string, format: YYYY-MM-DD)

**Odpowiedź:**
```json
[
  {
    "id": 1,
    "code": "USD",
    "currency": "Dolar Amerykański",
    "rate": 4.15,
    "effective_date": "2026-05-25"
  },
  ...
]
```

**Błędy:**
- `400` - Nieprawidłowy format daty

---

### POST `/currencies/fetch`
Pobiera najnowsze kursy z API NBP i zapisuje je do bazy.

**Parametry:** Brak

**Odpowiedź:**
```json
{
  "message": "Kursy walut zostały pomyślnie pobrane i zapisane."
}
```

**Błędy:**
- `400` - Błąd połączenia z NBP API

---

## Struktura Bazy Danych

### Tabela: `currency_rate`

| Kolumna | Typ | Opis |
|---------|-----|------|
| `id` | SERIAL PRIMARY KEY | Unikalny identyfikator |
| `code` | VARCHAR(3) | Kod waluty (np. USD, EUR) |
| `currency` | VARCHAR(255) | Nazwa waluty |
| `rate` | DECIMAL(10,4) | Kurs wymiany |
| `effective_date` | DATE | Data obowiązywania kursu |
| `created_at` | TIMESTAMP | Czas dodania rekordu |

**Indeksy:**
- `(code, effective_date)` - dla szybkiego filtrowania

---

## Testy

### Uruchamianie testów:

```bash
# Backend - Python pytest
docker-compose exec backend pytest test_main.py -v

# Frontend - Angular/Jasmine
docker-compose exec frontend npm test -- --watch=false
```

### Pokrycie testów:

- **Backend:** 7 testów (100% endpoints)
- **Frontend:** 15 testów (funkcje, HTTP, filtrowanie)
- **Razem:** 22 testów 

Szczegóły w [TESTING.md](./TESTING.md)

---

## 🔧 Konfiguracja

### Backend (`.env`)

```env
DATABASE_URL=postgresql://user:password@db:5432/currency_db
API_NBP_URL=http://api.nbp.pl/api/exchangerates/tables/A/?format=json
```

### Frontend (`environment.ts`)

```typescript
export const environment = {
  apiUrl: 'http://localhost:8000',
  production: false
};
```

---

## Debugging

### Logi Backend'u:
```bash
docker-compose logs backend -f
```

### Logi Frontend'u:
```bash
docker-compose logs frontend -f
```

### Logi Bazy Danych:
```bash
docker-compose logs db -f
```

---

## Znane problemy

### Problem: `405 Method Not Allowed` na POST `/currencies/fetch`
**Rozwiązanie:** Backend wymaga CORS. Jest już skonfigurowany w `main.py`.

### Problem: Timeout przy pobieraniu danych
**Rozwiązanie:** API NBP może być powolne. Spróbuj ponownie za kilka sekund.
