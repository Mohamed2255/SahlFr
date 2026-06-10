import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Customer, LedgerEntry } from '../../core/models';
import { formatCurrency, formatDate, getApiErrorMessage } from '../../core/utils/helpers';

@Component({
  selector: 'app-customers',
  imports: [FormsModule],
  templateUrl: './customers.html',
  styleUrl: './customers.scss'
})
export class CustomersComponent implements OnInit {
  protected readonly customers = signal<Customer[]>([]);
  protected readonly ledger = signal<LedgerEntry[]>([]);
  protected readonly selected = signal<Customer | null>(null);
  protected readonly showForm = signal(false);
  protected readonly showPayment = signal(false);
  protected readonly formatCurrency = formatCurrency;
  protected readonly formatDate = formatDate;

  form = { id: '', name: '', mobile: '', address: '', email: '', notes: '', creditLimit: 0, isActive: true };
  paymentAmount = 0;

  constructor(
    protected readonly auth: AuthService,
    private readonly api: ApiService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.api.getCustomers().subscribe({ next: (c) => this.customers.set(c) });
  }

  openCreate(): void {
    this.form = { id: '', name: '', mobile: '', address: '', email: '', notes: '', creditLimit: 5000, isActive: true };
    this.showForm.set(true);
  }

  openEdit(c: Customer): void {
    this.form = { id: c.id, name: c.name, mobile: c.mobile, address: c.address, email: c.email, notes: c.notes, creditLimit: c.creditLimit, isActive: c.isActive };
    this.showForm.set(true);
  }

  save(): void {
    this.api.upsertCustomer({ ...this.form, id: this.form.id || undefined }).subscribe({
      next: () => { this.toast.success('تم الحفظ'); this.showForm.set(false); this.ngOnInit(); },
      error: (e) => this.toast.error(getApiErrorMessage(e))
    });
  }

  viewLedger(c: Customer): void {
    this.selected.set(c);
    this.api.getCustomerLedger(c.id).subscribe({ next: (l) => this.ledger.set(l) });
  }

  openPayment(c: Customer): void {
    this.selected.set(c);
    this.paymentAmount = 0;
    this.showPayment.set(true);
  }

  submitPayment(): void {
    const c = this.selected();
    if (!c) return;
    this.api.recordCustomerPayment(c.id, this.paymentAmount).subscribe({
      next: () => { this.toast.success('تم تسجيل الدفعة'); this.showPayment.set(false); this.ngOnInit(); },
      error: (e) => this.toast.error(getApiErrorMessage(e))
    });
  }
}
