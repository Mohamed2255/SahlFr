import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AgingItem, InventoryValuation, ProfitReport, SalesReport } from '../../core/models';
import { formatCurrency, formatDate, getApiErrorMessage, toDateInputValue } from '../../core/utils/helpers';
import { exportToCsv } from '../../core/utils/export';

@Component({
  selector: 'app-reports',
  imports: [FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.scss'
})
export class ReportsComponent implements OnInit {
  protected readonly tab = signal<'profit' | 'sales' | 'inventory' | 'aging'>('profit');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly profitReport = signal<ProfitReport | null>(null);
  protected readonly salesReport = signal<SalesReport[]>([]);
  protected readonly inventoryReport = signal<InventoryValuation[]>([]);
  protected readonly customerAging = signal<AgingItem[]>([]);
  protected readonly vendorAging = signal<AgingItem[]>([]);
  protected readonly formatCurrency = formatCurrency;
  protected readonly formatDate = formatDate;

  startDate = '';
  endDate = '';
  salesPeriod = 'daily';

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    this.startDate = toDateInputValue(monthStart);
    this.endDate = toDateInputValue(today);
    this.loadTab();
  }

  exportCurrent(): void {
    const tab = this.tab();
    if (tab === 'profit' && this.profitReport()) {
      const r = this.profitReport()!;
      exportToCsv(
        'profit-report.csv',
        ['الفاتورة', 'التاريخ', 'الكاشير', 'الإيراد', 'التكلفة', 'الربح'],
        r.sales.map((s) => [s.saleNumber, s.saleDate, s.cashierName, s.totalRevenue, s.totalCost, s.netProfit])
      );
    } else if (tab === 'sales') {
      exportToCsv(
        'sales-report.csv',
        ['الفترة', 'عدد الفواتير', 'إجمالي المبيعات'],
        this.salesReport().map((s) => [s.period, s.invoiceCount, s.totalSales])
      );
    } else if (tab === 'inventory') {
      exportToCsv(
        'inventory-valuation.csv',
        ['المنتج', 'الكمية', 'تكلفة الوحدة', 'القيمة'],
        this.inventoryReport().map((i) => [i.name, i.quantity, i.unitCost, i.totalValue])
      );
    }
  }

  loadTab(): void {
    this.loading.set(true);
    this.error.set('');
    const tab = this.tab();

    if (tab === 'profit') {
      this.api.getProfitReport(this.startDate || undefined, this.endDate || undefined).subscribe({
        next: (r) => { this.profitReport.set(r); this.loading.set(false); },
        error: (e) => { this.error.set(getApiErrorMessage(e)); this.loading.set(false); }
      });
    } else if (tab === 'sales') {
      this.api.getSalesReport(this.salesPeriod, this.startDate || undefined, this.endDate || undefined).subscribe({
        next: (r) => { this.salesReport.set(r); this.loading.set(false); },
        error: (e) => { this.error.set(getApiErrorMessage(e)); this.loading.set(false); }
      });
    } else if (tab === 'inventory') {
      this.api.getInventoryValuation().subscribe({
        next: (r) => { this.inventoryReport.set(r); this.loading.set(false); },
        error: (e) => { this.error.set(getApiErrorMessage(e)); this.loading.set(false); }
      });
    } else {
      this.api.getCustomerAging().subscribe({ next: (r) => this.customerAging.set(r) });
      this.api.getVendorAging().subscribe({
        next: (r) => { this.vendorAging.set(r); this.loading.set(false); },
        error: (e) => { this.error.set(getApiErrorMessage(e)); this.loading.set(false); }
      });
    }
  }
}
