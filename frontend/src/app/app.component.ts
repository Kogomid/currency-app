import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  rates: any[] = [];
  filteredRates: any[] = [];
  filterDate: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  sortColumn: string = 'code';
  sortDirection: 'asc' | 'desc' = 'asc';
  availableYears: number[] = [];
  selectedYear: number | null = null;
  selectedQuarter: number | null = null;
  selectedMonth: number | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadAllRates();
  }

  fetchFromNBP() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    this.http.post('http://localhost:8000/currencies/fetch', {}).subscribe({
      next: () => {
        this.successMessage = 'Dane pomyślnie pobrane z NBP!';
        setTimeout(() => this.successMessage = '', 3000);
        this.loadAllRates();
      },
      error: (err) => {
        this.errorMessage = 'Błąd pobierania danych z NBP';
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  loadAllRates() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.http.get<any[]>('http://localhost:8000/currencies').subscribe({
      next: (data) => {
        this.rates = data;
        this.filteredRates = [...data];
        this.extractAvailableYears();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Błąd wczytywania danych';
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  filterByDate() {
    if (this.filterDate) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.http.get<any[]>(`http://localhost:8000/currencies/${this.filterDate}`).subscribe({
        next: (data) => {
          this.filteredRates = data;
          this.isLoading = false;
          if (data.length === 0) {
            this.errorMessage = 'Brak danych dla wybranej daty';
          }
        },
        error: (err) => {
          this.errorMessage = 'Błąd przy filtrowaniu po dacie';
          console.error(err);
          this.isLoading = false;
        }
      });
    } else {
      this.filteredRates = [...this.rates];
      this.errorMessage = '';
    }
  }

  filterByPeriod() {
    this.filteredRates = this.rates.filter(rate => {
      const rateYear = this.getYear(rate.effective_date);
      const rateQuarter = this.getQuarter(rate.effective_date);
      const rateMonth = this.getMonth(rate.effective_date);

      if (this.selectedYear && rateYear !== this.selectedYear) return false;
      if (this.selectedQuarter && rateQuarter !== this.selectedQuarter) return false;
      if (this.selectedMonth && rateMonth !== this.selectedMonth) return false;

      return true;
    });
  }

  clearFilters() {
    this.filterDate = '';
    this.selectedYear = null;
    this.selectedQuarter = null;
    this.selectedMonth = null;
    this.filteredRates = [...this.rates];
    this.errorMessage = '';
  }

  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredRates.sort((a, b) => {
      let aValue = a[column];
      let bValue = b[column];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return '⇅';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  extractAvailableYears() {
    const years = new Set(this.rates.map(rate => this.getYear(rate.effective_date)));
    this.availableYears = Array.from(years).sort((a, b) => b - a);
  }

  getYear(dateStr: string) {
    return new Date(dateStr).getFullYear();
  }

  getMonth(dateStr: string) {
    return new Date(dateStr).getMonth() + 1;
  }

  getQuarter(dateStr: string) {
    return Math.ceil(this.getMonth(dateStr) / 3);
  }

  getMonthName(month: number): string {
    const months = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
                    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
    return months[month - 1];
  }
}