# 🏗️ Architektura Projektu - Currency App

## Diagram przepływu danych

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Angular 19)                        │
│                      localhost:4200                              │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  AppComponent                                              │  │
│  │  - rates: CurrencyRate[]                                   │  │
│  │  - filteredRates: CurrencyRate[]                           │  │
│  │  - filterDate: string                                      │  │
│  │                                                            │  │
│  │  Metody:                                                   │  │
│  │  + fetchFromNBP() → POST /currencies/fetch                 │  │
│  │  + loadAllRates() → GET /currencies                        │  │
│  │  + filterByDate() → GET /currencies/{date}                 │  │
│  │                                                            │  │
│  │  Helpery:                                                  │  │
│  │  + getYear(date): number                                   │  │
│  │  + getMonth(date): number                                  │  │
│  │  + getQuarter(date): number                                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│               HTML Template + CSS Styling                          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ • Przyciski (Pobierz, Załaduj)                             │  │
│  │ • Input data (filtrowanie)                                 │  │
│  │ • Tabela kursów walut                                      │  │
│  │ • Empty state (brak danych)                                │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                          ↕ HTTP Requests
                    (CORS Middleware)
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI)                             │
│                      localhost:8000                               │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ API Routes                                                 │  │
│  │                                                            │  │
│  │ GET /currencies                                            │  │
│  │   → db.query(CurrencyRate).all()                           │  │
│  │   ← [{ code, currency, rate, effective_date }, ...]        │  │
│  │                                                            │  │
│  │ GET /currencies/{date}                                     │  │
│  │   → Validate date format (YYYY-MM-DD)                      │  │
│  │   → db.query(CurrencyRate).filter(...effective_date...)    │  │
│  │   ← [CurrencyRate, ...]                                    │  │
│  │                                                            │  │
│  │ POST /currencies/fetch                                     │  │
│  │   → requests.get(api.nbp.pl/exchangerates/tables/A)        │  │
│  │   → Parse JSON response                                    │  │
│  │   → Check for duplicates (code + date)                     │  │
│  │   → Save to database                                       │  │
│  │   ← { message: "..." }                                     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Dependency Injection (FastAPI Depends)                     │  │
│  │                                                            │  │
│  │ def get_db():                                              │  │
│  │   db = SessionLocal()  # SQLAlchemy Session                │  │
│  │   try:                                                     │  │
│  │     yield db                                               │  │
│  │   finally:                                                 │  │
│  │     db.close()                                             │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                          ↕ SQL Queries
                     (SQLAlchemy ORM)
┌─────────────────────────────────────────────────────────────────┐
│                   DATABASE (PostgreSQL)                           │
│                      localhost:5432                               │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Table: currency_rate                                       │  │
│  │                                                            │  │
│  │ id (SERIAL PK)                                             │  │
│  │ code (VARCHAR(3)) - Index                                  │  │
│  │ currency (VARCHAR(255))                                    │  │
│  │ rate (DECIMAL(10,4))                                       │  │
│  │ effective_date (DATE) - Index                              │  │
│  │ created_at (TIMESTAMP)                                     │  │
│  │                                                            │  │
│  │ Composite Index: (code, effective_date)                    │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                          ↕ HTTP GET
                     (requests library)
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL API (NBP)                             │
│                  api.nbp.pl/exchangerates                         │
│  • Pobieranie aktualnych kursów walut                             │
│  • Format: JSON                                                   │
│  • Aktualizacja: codziennie                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Przepływ danych - Szczegółowy

### 1. Pobieranie danych z NBP

```
User clicks "Pobierz najnowsze z NBP"
    ↓
AppComponent.fetchFromNBP()
    ↓
HTTP POST → localhost:8000/currencies/fetch
    ↓
Backend: FastAPI route /currencies/fetch
    ↓
requests.get("http://api.nbp.pl/api/exchangerates/tables/A/?format=json")
    ↓
Parse JSON response → Extract: code, currency, rate, effective_date
    ↓
For each rate:
  - Check if (code + date) exists in database
  - If NOT exists: INSERT INTO currency_rate
    ↓
db.commit()
    ↓
Return: { message: "Kursy walut zostały pomyślnie..." }
    ↓
Frontend: AppComponent.loadAllRates()
    ↓
HTTP GET → localhost:8000/currencies
    ↓
Backend returns all CurrencyRate objects
    ↓
Display in table
```

### 2. Filtrowanie po dacie

```
User enters date and clicks "Szukaj"
    ↓
AppComponent.filterByDate()
    ↓
HTTP GET → localhost:8000/currencies/2026-06-10
    ↓
Backend:
  - Validate date format (YYYY-MM-DD)
  - Query: SELECT * FROM currency_rate WHERE effective_date = '2026-06-10'
    ↓
Return matching rows
    ↓
Frontend displays filtered results in table
```

---

## Model danych

### CurrencyRate (Entity)

```typescript
interface CurrencyRate {
  id: number;              // Primary Key
  code: string;            // "USD", "EUR", "GBP"
  currency: string;        // "Dolar Amerykański"
  rate: number;            // 3.65
  effective_date: string;  // "2026-05-25"
  created_at?: string;     // "2026-05-25T10:30:00Z"
}
```

### Request Models

```typescript
// POST /currencies/fetch
// Body: {} (empty)
// Response: { message: string }

// GET /currencies
// Params: none
// Response: CurrencyRate[]

// GET /currencies/{date}
// Params: date (string: YYYY-MM-DD)
// Response: CurrencyRate[]
```

---

## Warstwy aplikacji

### 1. Presentation Layer (Frontend)

**Komponenty:**
- `AppComponent` - Główny komponent
- `CurrencyTableComponent` - Wyświetlanie tabeli (opcjonalnie)
- `FilterComponent` - Filtrowanie (opcjonalnie)

**Usługi (Services):**
- `CurrencyService` - Komunikacja z API

**Routing:** (opcjonalnie)
- `/rates` - Lista kursów
- `/rates/:date` - Kursy z konkretnej daty

### 2. Business Logic Layer (Backend)

**API Routes:**
- Endpoint `/currencies/fetch` - Pobieranie z NBP
- Endpoint `/currencies` - Lista wszystkich
- Endpoint `/currencies/{date}` - Filtrowanie

**Logika biznesowa:**
- Validacja danych
- Duplikaty
- Parsowanie odpowiedzi NBP

### 3. Data Access Layer (Database)

**ORM:** SQLAlchemy
**DBMS:** PostgreSQL

---

## Bezpieczeństwo

### CORS (Cross-Origin Resource Sharing)

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Walidacja

- **Frontend:** Validacja formatu daty (input type="date")
- **Backend:** Walidacja formatu YYYY-MM-DD

### Error Handling

- **400 Bad Request** - Nieprawidłowy format daty
- **404 Not Found** - Dane nie znalezione
- **500 Internal Server Error** - Błąd serwera

---

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│       Docker Compose (docker-compose.yml)│
│                                          │
│  ┌──────────────────────────────────┐   │
│  │  Frontend Container               │   │
│  │  - Node.js 18                     │   │
│  │  - Angular CLI                    │   │
│  │  - Port 4200                      │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │  Backend Container                │   │
│  │  - Python 3.11                    │   │
│  │  - FastAPI                        │   │
│  │  - Port 8000                      │   │
│  │  - Depends on: db                 │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │  Database Container               │   │
│  │  - PostgreSQL 15                  │   │
│  │  - Port 5432                      │   │
│  │  - Volume: db_data                │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 🧪 Testing Strategy

### Frontend Tests (Jasmine/Karma)

- **Unit Tests**: Komponenty, serwisy, helpery
- **Integration Tests**: HTTP requests (HttpTestingController)
- **Coverage**: 80%+

### Backend Tests (pytest)

- **Unit Tests**: Endpoints, logika biznesowa
- **Integration Tests**: Baza danych
- **Coverage**: 85%+

---

## Best Practices

Separation of Concerns
DRY (Don't Repeat Yourself)
SOLID Principles
Error Handling
Input Validation
Logging
Unit Tests
Documentation

---
