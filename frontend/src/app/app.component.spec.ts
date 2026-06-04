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

  it('powinien zainicjować puste arrays i stany', () => {
    expect(component.rates).toEqual([]);
    expect(component.filteredRates).toEqual([]);
    expect(component.filterDate).toBe('');
    expect(component.isLoading).toBe(false);
    expect(component.errorMessage).toBe('');
    expect(component.successMessage).toBe('');
    expect(component.sortColumn).toBe('code');
    expect(component.sortDirection).toBe('asc');
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

    it('getMonthName() powinien zwrócić prawidłową nazwę miesiąca', () => {
      expect(component.getMonthName(1)).toBe('Styczeń');
      expect(component.getMonthName(5)).toBe('Maj');
      expect(component.getMonthName(12)).toBe('Grudzień');
    });
  });

  describe('Żądania HTTP', () => {
    it('loadAllRates() powinien pobrać wszystkie kursy i wstawić je do rates', () => {
      const mockData = [
        { id: 1, code: 'USD', currency: 'Dolar', rate: 4.15, effective_date: '2026-06-11' },
        { id: 2, code: 'EUR', currency: 'Euro', rate: 4.5, effective_date: '2026-06-11' }
      ];

      component.loadAllRates();

      const req = httpMock.expectOne('http://localhost:8000/currencies');
      expect(req.request.method).toBe('GET');
      req.flush(mockData);

      expect(component.rates.length).toBe(2);
      expect(component.filteredRates.length).toBe(2);
    });

    it('fetchFromNBP() powinien wysłać POST request i załadować dane', () => {
      spyOn(component, 'loadAllRates');
      
      component.fetchFromNBP();

      expect(component.isLoading).toBe(true);
      
      const req = httpMock.expectOne('http://localhost:8000/currencies/fetch');
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Dane pobrane' });

      expect(component.loadAllRates).toHaveBeenCalled();
      expect(component.successMessage).toBe('✅ Dane pomyślnie pobrane z NBP!');
    });

    it('filterByDate() powinien pobrać kursy dla wybranej daty', () => {
      const mockData = [
        { id: 3, code: 'USD', currency: 'Dolar', rate: 4.15, effective_date: '2026-06-10' }
      ];

      component.filterDate = '2026-06-10';
      component.filterByDate();

      const req = httpMock.expectOne('http://localhost:8000/currencies/2026-06-10');
      expect(req.request.method).toBe('GET');
      req.flush(mockData);

      expect(component.filteredRates.length).toBe(1);
    });

    it('filterByDate() powinien wyświetlić wszystkie przy pustej dacie', () => {
      component.rates = [
        { id: 1, code: 'USD', currency: 'Dolar', rate: 4.15, effective_date: '2026-06-11' }
      ];
      component.filterDate = '';

      component.filterByDate();

      expect(component.filteredRates).toEqual(component.rates);
      expect(component.errorMessage).toBe('');
    });
  });

  describe('Filtrowanie po okresach', () => {
    beforeEach(() => {
      component.rates = [
        { id: 1, code: 'USD', currency: 'Dolar', rate: 4.15, effective_date: '2026-01-15' },
        { id: 2, code: 'EUR', currency: 'Euro', rate: 4.5, effective_date: '2026-05-20' },
        { id: 3, code: 'GBP', currency: 'Funt', rate: 5.2, effective_date: '2025-10-30' }
      ];
      component.filteredRates = [...component.rates];
    });

    it('filterByPeriod() powinien filtrować po roku', () => {
      component.selectedYear = 2026;
      component.filterByPeriod();

      expect(component.filteredRates.length).toBe(2);
    });

    it('filterByPeriod() powinien filtrować po kwartale', () => {
      component.selectedYear = 2026;
      component.selectedQuarter = 2;
      component.filterByPeriod();

      expect(component.filteredRates.length).toBe(1);
      expect(component.filteredRates[0].code).toBe('EUR');
    });

    it('filterByPeriod() powinien filtrować po miesiącu', () => {
      component.selectedYear = 2026;
      component.selectedMonth = 5;
      component.filterByPeriod();

      expect(component.filteredRates.length).toBe(1);
    });

    it('clearFilters() powinien wyczyścić wszystkie filtry', () => {
      component.filterDate = '2026-06-10';
      component.selectedYear = 2026;
      component.selectedQuarter = 2;
      component.selectedMonth = 5;
      component.errorMessage = 'Jakiś błąd';

      component.clearFilters();

      expect(component.filterDate).toBe('');
      expect(component.selectedYear).toBeNull();
      expect(component.selectedQuarter).toBeNull();
      expect(component.selectedMonth).toBeNull();
      expect(component.errorMessage).toBe('');
      expect(component.filteredRates).toEqual(component.rates);
    });
  });

  describe('Sortowanie', () => {
    beforeEach(() => {
      component.filteredRates = [
        { id: 1, code: 'USD', currency: 'Dolar', rate: 4.15, effective_date: '2026-06-11' },
        { id: 2, code: 'EUR', currency: 'Euro', rate: 4.5, effective_date: '2026-06-12' },
        { id: 3, code: 'GBP', currency: 'Funt', rate: 5.2, effective_date: '2026-06-10' }
      ];
    });

    it('sortBy() powinien sortować rosnąco po kolumnie code', () => {
      component.sortBy('code');

      expect(component.sortColumn).toBe('code');
      expect(component.sortDirection).toBe('asc');
      expect(component.filteredRates[0].code).toBe('EUR');
      expect(component.filteredRates[2].code).toBe('USD');
    });

    it('sortBy() powinien zmienić kierunek sortowania', () => {
      component.sortBy('code');
      component.sortBy('code');

      expect(component.sortDirection).toBe('desc');
      expect(component.filteredRates[0].code).toBe('USD');
      expect(component.filteredRates[2].code).toBe('EUR');
    });

    it('getSortIcon() powinien zwrócić prawidłową ikonę', () => {
      component.sortColumn = 'code';
      component.sortDirection = 'asc';

      expect(component.getSortIcon('code')).toBe('↑');
      expect(component.getSortIcon('rate')).toBe('⇅');

      component.sortDirection = 'desc';
      expect(component.getSortIcon('code')).toBe('↓');
    });
  });

  describe('Struktura danych', () => {
    it('kurs powinien mieć wszystkie wymagane pola', () => {
      const mockRate = {
        id: 1,
        code: 'USD',
        currency: 'Dolar Amerykański',
        rate: 4.15,
        effective_date: '2026-06-11'
      };

      expect(mockRate.id).toBeDefined();
      expect(mockRate.code).toBeDefined();
      expect(mockRate.currency).toBeDefined();
      expect(mockRate.rate).toBeDefined();
      expect(mockRate.effective_date).toBeDefined();
      expect(typeof mockRate.rate).toBe('number');
      expect(mockRate.rate).toBeGreaterThan(0);
    });
  });

  describe('Dostępne lata', () => {
    it('extractAvailableYears() powinien wyodrębnić unikalne lata', () => {
      component.rates = [
        { id: 1, code: 'USD', currency: 'Dolar', rate: 4.15, effective_date: '2026-06-11' },
        { id: 2, code: 'EUR', currency: 'Euro', rate: 4.5, effective_date: '2025-06-11' },
        { id: 3, code: 'GBP', currency: 'Funt', rate: 5.2, effective_date: '2026-01-15' }
      ];

      component.extractAvailableYears();

      expect(component.availableYears.length).toBe(2);
      expect(component.availableYears).toContain(2026);
      expect(component.availableYears).toContain(2025);
      expect(component.availableYears[0]).toBe(2026);
    });
  });
});