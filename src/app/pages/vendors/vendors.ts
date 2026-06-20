import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { LedgerEntry, Vendor } from '../../core/models';
import { formatCurrency, formatDate, getApiErrorMessage } from '../../core/utils/helpers';

@Component({
  selector: 'app-vendors',
  imports: [FormsModule],
  templateUrl: './vendors.html',
  styleUrl: './vendors.scss'
})
export class VendorsComponent implements OnInit {
  protected readonly vendors = signal<Vendor[]>([]);
  protected readonly ledger = signal<LedgerEntry[]>([]);
  protected readonly selected = signal<Vendor | null>(null);
  protected readonly showForm = signal(false);
  protected readonly showPayment = signal(false);
  protected readonly formatCurrency = formatCurrency;
  protected readonly formatDate = formatDate;

  form = { id: '', name: '', mobile: '', address: '', email: '', notes: '', isActive: true };
  paymentAmount = 0;

  constructor(private readonly api: ApiService, private readonly toast: ToastService) {}

  ngOnInit(): void {
    this.api.getVendors().subscribe({ next: (v) => this.vendors.set(v) });
  }

  openCreate(): void {
    this.form = { id: '', name: '', mobile: '', address: '', email: '', notes: '', isActive: true };
    this.showForm.set(true);
  }

  openEdit(v: Vendor): void {
    this.form = { id: v.id, name: v.name, mobile: v.mobile, address: v.address, email: v.email, notes: v.notes, isActive: v.isActive };
    this.showForm.set(true);
  }

  isValidMobile(mobile: string): boolean {
    return /^[0-9]+$/.test(mobile);
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  save(): void {
    if (!this.form.name.trim()) {
      this.toast.error('الاسم مطلوب.');
      return;
    }
    if (!this.form.mobile.trim()) {
      this.toast.error('رقم الهاتف مطلوب.');
      return;
    }
    if (!this.isValidMobile(this.form.mobile)) {
      this.toast.error('يجب أن يحتوي رقم الهاتف على أرقام فقط.');
      return;
    }
    if (!this.form.email.trim()) {
      this.toast.error('البريد الإلكتروني مطلوب.');
      return;
    }
    if (!this.isValidEmail(this.form.email)) {
      this.toast.error('البريد الإلكتروني غير صحيح.');
      return;
    }

    this.api.upsertVendor({ ...this.form, id: this.form.id || undefined }).subscribe({
      next: () => { this.toast.success('تم الحفظ'); this.showForm.set(false); this.ngOnInit(); },
      error: (e) => this.toast.error(getApiErrorMessage(e))
    });
  }

  viewLedger(v: Vendor): void {
    this.selected.set(v);
    this.api.getVendorLedger(v.id).subscribe({ next: (l) => this.ledger.set(l) });
  }

  openPayment(v: Vendor): void {
    this.selected.set(v);
    this.paymentAmount = 0;
    this.showPayment.set(true);
  }

  submitPayment(): void {
    const v = this.selected();
    if (!v) return;
    if (this.paymentAmount <= 0) {
      this.toast.error('يجب أن تكون قيمة الدفعة أكبر من الصفر.');
      return;
    }
    this.api.recordVendorPayment(v.id, this.paymentAmount).subscribe({
      next: () => { this.toast.success('تم تسجيل الدفعة'); this.showPayment.set(false); this.ngOnInit(); },
      error: (e) => this.toast.error(getApiErrorMessage(e))
    });
  }
}
