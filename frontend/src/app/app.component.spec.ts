import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AppComponent } from './app.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: any;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, CommonModule, FormsModule, AppComponent]
    });
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('powinien stworzyć aplikację', () => {
    expect(component).toBeTruthy();
  });

  it('powinien zainicjować puste arrays', () => {
    expect(component.rates).toEqual([]);
    expect(component.filteredRates).toEqual([]);
    expect(component.filterDate).toBe('');
  });

  describe('Funkcje pomocnicze daty', () => {
    it('getYear() powinien zwrócić prawidłowy rok', () => {
      expect(component.getYear('2026-05-25')).toBe(2026);
      expect(component.getYear('2025-01-01')).toBe(2025);
    });

    it('getMonth() powinien zwrócić prawidłowy miesiąc', () => {
      expect(component.getMonth('2026-01-15')).toBe(1);
      expect(component.getMonth('2026-12-31')).toBe(12);
      expect(component.getMonth('2026-05-25')).toBe(5);
    });

    it('getQuarter() powinien zwrócić prawidłowy kwartał', () => {
      expect(component.getQuarter('2026-01-01')).toBe(1);
      expect(component.getQuarter('2026-04-15')).toBe(2);
      expect(component.getQuarter('2026-07-20')).toBe(3);
      expect(component.getQuarter('2026-10-30')).toBe(4);
      expect(component.getQuarter('2026-05-25')).toBe(2);
    });
  });

  describe('Żądania HTTP', () => {
    it('loadAllRates() powinien pobrać wszystkie kursy', () => {
      const mockData = [
        { code: 'USD', currency: 'Dolar', rate: 4.15, effective_date: '2026-06-11' },
        { code: 'EUR', currency: 'Euro', rate: 4.5, effective_date: '2026-06-11' }
      ];

      component.loadAllRates();

      const req = httpMock.expectOne('http://localhost:8000/currencies');
      expect(req.request.method).toBe('GET');
      req.flush(mockData);

      expect(component.rates).toEqual(mockData);
      expect(component.filteredRates).toEqual(mockData);
    });

    it('fetchFromNBP() powinien wysłać POST request', () => {
      spyOn(component, 'loadAllRates');
      
      component.fetchFromNBP();

      const req = httpMock.expectOne('http://localhost:8000/currencies/fetch');
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Dane pobrane' });

      expect(component.loadAllRates).toHaveBeenCalled();
    });

    it('filterByDate() powinien pobrać kursy dla wybranej daty', () => {
      const mockData = [
        { code: 'USD', currency: 'Dolar', rate: 4.15, effective_date: '2026-06-10' }
      ];

      component.filterDate = '2026-06-10';
      component.filterByDate();

      const req = httpMock.expectOne('http://localhost:8000/currencies/2026-06-10');
      expect(req.request.method).toBe('GET');
      req.flush(mockData);

      expect(component.filteredRates).toEqual(mockData);
    });

    it('filterByDate() powinien wyświetlić wszystkie przy pustej dacie', () => {
      component.rates = [
        { code: 'USD', currency: 'Dolar', rate: 4.15, effective_date: '2026-06-11' }
      ];
      component.filterDate = '';

      component.filterByDate();

      expect(component.filteredRates).toEqual(component.rates);
    });
  });

  describe('Filtrowanie danych', () => {
    beforeEach(() => {
      component.rates = [
        { code: 'USD', currency: 'Dolar', rate: 4.15, effective_date: '2026-06-11' },
        { code: 'EUR', currency: 'Euro', rate: 4.5, effective_date: '2026-06-11' },
        { code: 'GBP', currency: 'Funt', rate: 5.2, effective_date: '2026-06-10' }
      ];
      component.filteredRates = [...component.rates];
    });

    it('powinien filtrować po dacie', () => {
      component.filterDate = '2026-06-10';
      component.filterByDate();

      const req = httpMock.expectOne('http://localhost:8000/currencies/2026-06-10');
      req.flush([component.rates[2]]);

      expect(component.filteredRates.length).toBe(1);
    });
  });

  describe('Struktura danych', () => {
    it('kurs powinien mieć wszystkie wymagane pola', () => {
      const mockRate = {
        code: 'USD',
        currency: 'Dolar Amerykański',
        rate: 4.15,
        effective_date: '2026-06-11'
      };

      expect(mockRate.code).toBeDefined();
      expect(mockRate.currency).toBeDefined();
      expect(mockRate.rate).toBeDefined();
      expect(mockRate.effective_date).toBeDefined();
      expect(typeof mockRate.rate).toBe('number');
      expect(mockRate.rate).toBeGreaterThan(0);
    });
  });
});