from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, CurrencyRate
import requests
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/currencies/fetch")
def fetch_currencies(db: Session = Depends(get_db)):
    response = requests.get("http://api.nbp.pl/api/exchangerates/tables/A/?format=json")
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Błąd pobierania z NBP API")
    
    data = response.json()[0]
    date_str = data['effectiveDate']
    rates = data['rates']
    
    effective_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    
    for item in rates:
        exists = db.query(CurrencyRate).filter(
            CurrencyRate.code == item['code'], 
            CurrencyRate.effective_date == effective_date
        ).first()
        
        if not exists:
            new_rate = CurrencyRate(
                currency=item['currency'],
                code=item['code'],
                rate=item['mid'],
                effective_date=effective_date
            )
            db.add(new_rate)
    
    db.commit()
    return {"message": "Kursy walut zostały pomyślnie pobrane i zapisane."}

@app.get("/currencies")
def get_all_currencies(db: Session = Depends(get_db)):
    return db.query(CurrencyRate).all()

@app.get("/currencies/{date}")
def get_currencies_by_date(date: str, db: Session = Depends(get_db)):
    try:
        query_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Nieprawidłowy format daty. Użyj YYYY-MM-DD")
        
    rates = db.query(CurrencyRate).filter(CurrencyRate.effective_date == query_date).all()
    return rates