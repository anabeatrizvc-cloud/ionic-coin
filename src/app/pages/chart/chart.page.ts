import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import Chart from 'chart.js/auto';
import { Currency } from '../../models/currency.model';
import { RateSnapshot } from '../../models/rate-cache.model';
import { StorageService } from '../../services/storage.service';

type ChartRange = 7 | 30;

@Component({
  selector: 'app-chart',
  templateUrl: './chart.page.html',
  styleUrls: ['./chart.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ChartPage implements AfterViewInit, OnDestroy {
  @ViewChild('ratesCanvas') ratesCanvas?: ElementRef<HTMLCanvasElement>;

  currencies: Currency[] = [];
  selectedBase = 'BRL';
  selectedTarget = 'USD';
  range: ChartRange = 7;
  chartMessage = '';

  private chart: Chart | null = null;
  private viewReady = false;

  constructor(private readonly storageService: StorageService) {}

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.loadCurrencies();
    this.loadChart();
  }

  ionViewWillEnter(): void {
    this.loadCurrencies();

    if (this.viewReady) {
      this.loadChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  onChartOptionsChange(): void {
    this.loadChart();
  }

  trackByCode(_: number, currency: Currency): string {
    return currency.code;
  }

  private loadCurrencies(): void {
    this.currencies = this.storageService.getCurrencies();
  }

  private loadChart(): void {
    const snapshots = this.storageService.getRateSnapshots(this.selectedBase, this.selectedTarget, this.range);
    const points = snapshots.length ? snapshots : this.getCachePoint();

    if (!points.length) {
      this.chartMessage = 'Ainda não há cotações armazenadas para este par de moedas.';
      this.chart?.destroy();
      this.chart = null;
      return;
    }

    this.chartMessage = points.length === 1
      ? 'Gráfico montado com a última cotação armazenada.'
      : `Variação com ${points.length} cotações armazenadas.`;

    this.renderChart(points);
  }

  private getCachePoint(): RateSnapshot[] {
    if (this.selectedBase === this.selectedTarget) {
      const now = new Date().toISOString();
      return [
        {
          date: now.slice(0, 10),
          base: this.selectedBase,
          target: this.selectedTarget,
          rate: 1,
          savedAt: now
        }
      ];
    }

    const cache = this.storageService.getRateCache(this.selectedBase);
    const rate = cache?.rates[this.selectedTarget];

    if (!cache || !rate) {
      return [];
    }

    return [
      {
        date: cache.savedAt.slice(0, 10),
        base: this.selectedBase,
        target: this.selectedTarget,
        rate,
        savedAt: cache.savedAt
      }
    ];
  }

  private renderChart(points: RateSnapshot[]): void {
    const canvas = this.ratesCanvas?.nativeElement;

    if (!canvas) {
      return;
    }

    this.chart?.destroy();

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: points.map((point) => this.formatChartDate(point.date)),
        datasets: [
          {
            label: `${this.selectedBase} para ${this.selectedTarget}`,
            data: points.map((point) => point.rate),
            borderColor: '#1f9d63',
            backgroundColor: 'rgba(31, 157, 99, 0.14)',
            fill: true,
            pointBackgroundColor: '#102f5e',
            pointBorderColor: '#ffffff',
            pointRadius: 4,
            tension: 0.25
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: {
              color: '#172033'
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#667085'
            },
            grid: {
              color: 'rgba(102, 112, 133, 0.16)'
            }
          },
          y: {
            ticks: {
              color: '#667085'
            },
            grid: {
              color: 'rgba(102, 112, 133, 0.16)'
            }
          }
        }
      }
    });
  }

  private formatChartDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    }).format(new Date(`${value}T00:00:00`));
  }
}
