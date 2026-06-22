import { AfterViewInit, Component, ElementRef, OnInit, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SubscriptionService, SubscriptionStatusDto } from '../../core/services/subscription.service';
import { DashboardData } from '../../core/models';
import { formatCurrency, formatDate } from '../../core/utils/helpers';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private readonly chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('salesChart');
  private chart?: Chart;

  protected readonly loading = signal(true);
  protected readonly data = signal<DashboardData | null>(null);
  protected readonly formatCurrency = formatCurrency;
  protected readonly formatDate = formatDate;
  protected readonly subStatus = signal<SubscriptionStatusDto | null>(null);

  constructor(
    protected readonly auth: AuthService,
    private readonly api: ApiService,
    private readonly subService: SubscriptionService
  ) {}

  ngOnInit(): void {
    this.subService.getStatus().subscribe({
      next: (s) => this.subStatus.set(s),
      error: () => {}
    });

    this.api.getDashboard().subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
        setTimeout(() => this.renderChart(), 50);
      },
      error: () => this.loading.set(false)
    });
  }

  ngAfterViewInit(): void {
    if (this.data()) this.renderChart();
  }

  private renderChart(): void {
    const canvas = this.chartCanvas()?.nativeElement;
    const chartData = this.data()?.salesChart;
    if (!canvas || !chartData?.length) return;

    this.chart?.destroy();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(148,163,184,0.15)' : 'rgba(100,116,139,0.15)';

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: chartData.map((p) => p.label),
        datasets: [{
          label: 'المبيعات',
          data: chartData.map((p) => p.amount),
          backgroundColor: 'rgba(79, 70, 229, 0.7)',
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: gridColor }, ticks: { color: isDark ? '#94a3b8' : '#64748b' } },
          x: { grid: { display: false }, ticks: { color: isDark ? '#94a3b8' : '#64748b' } }
        }
      }
    });
  }
}
