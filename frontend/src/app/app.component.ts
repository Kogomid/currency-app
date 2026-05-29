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

  constructor(private http: HttpClient) {}

  ngOnInit() {}

  fetchFromNBP() {
    this.http.post('http://localhost:8000/currencies/fetch', {}).subscribe(() => {
      alert('Dane pobrane z NBP!');
      this.loadAllRates();
    });
  }

  loadAllRates() {
    this.http.get<any[]>('http://localhost:8000/currencies').subscribe(data => {
      this.rates = data;
      this.filteredRates = data;
    });
  }

  filterByDate() {
    if (this.filterDate) {
      this.http.get<any[]>(`http://localhost:8000/currencies/${this.filterDate}`).subscribe(data => {
        this.filteredRates = data;
      });
    } else {
      this.filteredRates = this.rates;
    }
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
}