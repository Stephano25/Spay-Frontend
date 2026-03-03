import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTabsModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit {
  selectedPeriod = 'month';
  
  categories = [
    { name: 'Alimentation', amount: 250000, percentage: 30, color: '#ff9800' },
    { name: 'Transport', amount: 120000, percentage: 15, color: '#2196f3' },
    { name: 'Shopping', amount: 180000, percentage: 22, color: '#e91e63' },
    { name: 'Factures', amount: 200000, percentage: 24, color: '#4caf50' },
    { name: 'Autres', amount: 75000, percentage: 9, color: '#9c27b0' }
  ];

  trendChart: any;
  pieChart: any;

  ngOnInit(): void {
    this.createCharts();
  }

  createCharts(): void {
    setTimeout(() => {
      const trendCtx = document.getElementById('trendChart') as HTMLCanvasElement;
      if (trendCtx) {
        this.trendChart = new Chart(trendCtx, {
          type: 'line',
          data: {
            labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
            datasets: [
              {
                label: 'Revenus',
                data: [120000, 150000, 130000, 170000, 160000, 190000, 210000, 200000, 180000, 220000, 240000, 230000],
                borderColor: '#4caf50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4
              },
              {
                label: 'Dépenses',
                data: [80000, 95000, 85000, 110000, 105000, 125000, 140000, 135000, 120000, 145000, 160000, 155000],
                borderColor: '#f44336',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                tension: 0.4
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top'
              }
            }
          }
        });
      }

      const pieCtx = document.getElementById('pieChart') as HTMLCanvasElement;
      if (pieCtx) {
        this.pieChart = new Chart(pieCtx, {
          type: 'doughnut',
          data: {
            labels: this.categories.map(c => c.name),
            datasets: [{
              data: this.categories.map(c => c.amount),
              backgroundColor: this.categories.map(c => c.color),
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      }
    }, 100);
  }
}