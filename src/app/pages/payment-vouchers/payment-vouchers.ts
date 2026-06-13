import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { PaymentMethods, PaymentVoucher, Purchase, Vendor } from '../../core/models';
import { formatCurrency, formatDate, getApiErrorMessage } from '../../core/utils/helpers';

@Component({
  selector: 'app-payment-vouchers',
  imports: [FormsModule],
  templateUrl: './payment-vouchers.html',
  styleUrl: './payment-vouchers.scss'
})
export class PaymentVouchersComponent implements OnInit {
  protected readonly vouchers = signal<PaymentVoucher[]>([]);
  protected readonly vendors = signal<Vendor[]>([]);
  protected readonly vendorPurchases = signal<Purchase[]>([]);
  protected readonly showForm = signal(false);
  protected readonly loading = signal(true);
  protected readonly formatCurrency = formatCurrency;
  protected readonly formatDate = formatDate;
  protected readonly paymentMethods = PaymentMethods;

  form = {
    id: '',
    vendorId: '',
    amount: 0,
    paymentMethod: 0,
    chequeNumber: '',
    bankReference: '',
    notes: '',
    allocationPurchaseId: '',
    allocationAmount: 0
  };

  constructor(
    private readonly api: ApiService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
    this.api.getVendors().subscribe({ next: (v) => this.vendors.set(v.filter((x) => x.isActive)) });
  }

  load(): void {
    this.loading.set(true);
    this.api.getPaymentVouchers().subscribe({
      next: (v) => { this.vouchers.set(v); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate(): void {
    this.form = { id: '', vendorId: '', amount: 0, paymentMethod: 0, chequeNumber: '', bankReference: '', notes: '', allocationPurchaseId: '', allocationAmount: 0 };
    this.vendorPurchases.set([]);
    this.showForm.set(true);
  }

  onVendorChange(): void {
    if (!this.form.vendorId) {
      this.vendorPurchases.set([]);
      return;
    }
    this.api.getPurchases().subscribe({
      next: (purchases) => this.vendorPurchases.set(
        purchases.filter((p) => p.vendorName === this.vendors().find((v) => v.id === this.form.vendorId)?.name && p.dueAmount > 0)
      )
    });
  }

  save(): void {
    const allocations = this.form.allocationAmount > 0
      ? [{ purchaseId: this.form.allocationPurchaseId || undefined, amount: this.form.allocationAmount }]
      : [];

    this.api.upsertPaymentVoucher({
      id: this.form.id || undefined,
      vendorId: this.form.vendorId,
      amount: this.form.amount,
      paymentMethod: this.form.paymentMethod,
      chequeNumber: this.form.chequeNumber || undefined,
      bankReference: this.form.bankReference || undefined,
      notes: this.form.notes,
      allocations,
      postImmediately: true
    }).subscribe({
      next: () => { this.toast.success('تم حفظ سند الصرف'); this.showForm.set(false); this.load(); },
      error: (e) => this.toast.error(getApiErrorMessage(e))
    });
  }

  cancel(id: string): void {
    if (!confirm('إلغاء هذا السند؟')) return;
    this.api.cancelPaymentVoucher(id).subscribe({
      next: () => { this.toast.success('تم الإلغاء'); this.load(); },
      error: (e) => this.toast.error(getApiErrorMessage(e))
    });
  }

  print(voucher: PaymentVoucher): void {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html dir="rtl"><head><title>${voucher.voucherNumber}</title></head><body>
      <h1>سند صرف</h1>
      <p><strong>${voucher.voucherNumber}</strong> — ${formatDate(voucher.voucherDate)}</p>
      <p>المورد: ${voucher.vendorName}</p>
      <p>المبلغ: ${formatCurrency(voucher.amount)}</p>
      <p>طريقة الدفع: ${voucher.paymentMethod}</p>
      ${voucher.notes ? `<p>ملاحظات: ${voucher.notes}</p>` : ''}
      </body></html>`);
    w.document.close();
    w.print();
  }
}
