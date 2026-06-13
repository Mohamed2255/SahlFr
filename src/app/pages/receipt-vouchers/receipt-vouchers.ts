import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Customer, PaymentMethods, ReceiptVoucher, Sale } from '../../core/models';
import { formatCurrency, formatDate, getApiErrorMessage } from '../../core/utils/helpers';

@Component({
  selector: 'app-receipt-vouchers',
  imports: [FormsModule],
  templateUrl: './receipt-vouchers.html',
  styleUrl: './receipt-vouchers.scss'
})
export class ReceiptVouchersComponent implements OnInit {
  protected readonly vouchers = signal<ReceiptVoucher[]>([]);
  protected readonly customers = signal<Customer[]>([]);
  protected readonly customerSales = signal<Sale[]>([]);
  protected readonly showForm = signal(false);
  protected readonly loading = signal(true);
  protected readonly formatCurrency = formatCurrency;
  protected readonly formatDate = formatDate;
  protected readonly paymentMethods = PaymentMethods;

  form = {
    id: '',
    customerId: '',
    amount: 0,
    paymentMethod: 0,
    chequeNumber: '',
    bankReference: '',
    notes: '',
    allocationSaleId: '',
    allocationAmount: 0
  };

  constructor(
    private readonly api: ApiService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
    this.api.getCustomers().subscribe({ next: (c) => this.customers.set(c.filter((x) => x.isActive)) });
  }

  load(): void {
    this.loading.set(true);
    this.api.getReceiptVouchers().subscribe({
      next: (v) => { this.vouchers.set(v); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate(): void {
    this.form = { id: '', customerId: '', amount: 0, paymentMethod: 0, chequeNumber: '', bankReference: '', notes: '', allocationSaleId: '', allocationAmount: 0 };
    this.customerSales.set([]);
    this.showForm.set(true);
  }

  onCustomerChange(): void {
    if (!this.form.customerId) {
      this.customerSales.set([]);
      return;
    }
    this.api.getSales().subscribe({
      next: (sales) => this.customerSales.set(sales.filter((s) => s.customerName && this.customers().find((c) => c.id === this.form.customerId)?.name === s.customerName && s.dueAmount > 0))
    });
  }

  save(): void {
    const allocations = this.form.allocationAmount > 0
      ? [{ saleId: this.form.allocationSaleId || undefined, amount: this.form.allocationAmount }]
      : [];

    this.api.upsertReceiptVoucher({
      id: this.form.id || undefined,
      customerId: this.form.customerId,
      amount: this.form.amount,
      paymentMethod: this.form.paymentMethod,
      chequeNumber: this.form.chequeNumber || undefined,
      bankReference: this.form.bankReference || undefined,
      notes: this.form.notes,
      allocations,
      postImmediately: true
    }).subscribe({
      next: () => { this.toast.success('تم حفظ سند القبض'); this.showForm.set(false); this.load(); },
      error: (e) => this.toast.error(getApiErrorMessage(e))
    });
  }

  cancel(id: string): void {
    if (!confirm('إلغاء هذا السند؟')) return;
    this.api.cancelReceiptVoucher(id).subscribe({
      next: () => { this.toast.success('تم الإلغاء'); this.load(); },
      error: (e) => this.toast.error(getApiErrorMessage(e))
    });
  }

  print(voucher: ReceiptVoucher): void {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html dir="rtl"><head><title>${voucher.voucherNumber}</title></head><body>
      <h1>سند قبض</h1>
      <p><strong>${voucher.voucherNumber}</strong> — ${formatDate(voucher.voucherDate)}</p>
      <p>العميل: ${voucher.customerName}</p>
      <p>المبلغ: ${formatCurrency(voucher.amount)}</p>
      <p>طريقة الدفع: ${voucher.paymentMethod}</p>
      ${voucher.notes ? `<p>ملاحظات: ${voucher.notes}</p>` : ''}
      </body></html>`);
    w.document.close();
    w.print();
  }
}
