from fastapi.testclient import TestClient
from main import app
from database import SessionLocal, CurrencyRate, Base, engine
from datetime import date

client = TestClient(app)

Base.metadata.create_all(bind=engine)

def test_fetch_currencies():
    """Test pobierania danych z API NBP"""
    response = client.post("/currencies/fetch")
    assert response.status_code == 200
    assert "pomyślnie" in response.json()["message"].lower()

def test_get_all_currencies():
    """Test pobierania wszystkich kursów"""
    response = client.get("/currencies")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    if len(response.json()) > 0:
        rate = response.json()[0]
        assert "code" in rate
        assert "currency" in rate
        assert "rate" in rate
        assert "effective_date" in rate

def test_get_currencies_by_valid_date():
    """Test pobierania kursów dla konkretnej daty"""
    all_rates = client.get("/currencies").json()
    
    if len(all_rates) > 0:
        test_date = all_rates[0]["effective_date"]
        response = client.get(f"/currencies/{test_date}")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

def test_get_currencies_by_invalid_date():
    """Test pobierania z nieprawidłową datą"""
    response = client.get("/currencies/invalid-date")
    assert response.status_code == 400
    assert "format" in response.json()["detail"].lower()

def test_get_currencies_by_future_date():
    """Test pobierania z przyszłą datą (powinna być pusta lista)"""
    response = client.get("/currencies/2099-12-31")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) == 0

def test_currency_data_structure():
    """Test poprawności struktury danych waluty"""
    response = client.get("/currencies")
    assert response.status_code == 200
    rates = response.json()
    
    if len(rates) > 0:
        rate = rates[0]
        assert isinstance(rate["code"], str)
        assert isinstance(rate["currency"], str)
        assert isinstance(rate["rate"], (int, float))
        assert isinstance(rate["effective_date"], str)
        assert 2 <= len(rate["code"]) <= 3

def test_fetch_idempotency():
    """Test że pobieranie tych samych danych nie tworzy duplikatów"""
    response1 = client.post("/currencies/fetch")
    assert response1.status_code == 200
    
    response2 = client.post("/currencies/fetch")
    assert response2.status_code == 200
    
    all_rates = client.get("/currencies").json()
    assert len(all_rates) > 0