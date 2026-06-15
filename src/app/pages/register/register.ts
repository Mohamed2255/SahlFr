import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { CashRegister, CashRegisterTransaction } from '../../core/models';
import { formatCurrency, formatDate, getApiErrorMessage, toDateInputValue } from '../../core/utils/helpers';

@Component({
  selector: 'app-register',
  imports: [FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent implements OnInit {
  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly current = signal<CashRegister | null>(null);
  protected readonly history = signal<CashRegister[]>([]);
  protected readonly formatCurrency = formatCurrency;
  protected readonly formatDate = formatDate;

  openForm = {
    businessDate: toDateInputValue(new Date()),
    openingBalance: 0,
    notes: ''
  };

  closeForm: {
    actualClosingBalance: number | null;
    closingNotes: string;
  } = {
    actualClosingBalance: null,
    closingNotes: ''
  };

  constructor(
    private readonly api: ApiService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getCurrentCashRegister().subscribe({
      next: (register) => {
        this.current.set(register);
        this.closeForm.actualClosingBalance = register?.currentClosingBalance ?? null;
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.api.getCashRegisterHistory().subscribe({
      next: (history) => this.history.set(history)
    });
  }

  openRegister(): void {
    this.submitting.set(true);
    this.api.openCashRegister({
      businessDate: this.openForm.businessDate || undefined,
      openingBalance: this.openForm.openingBalance,
      notes: this.openForm.notes
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toast.success('تم فتح الصندوق بنجاح');
        this.openForm.notes = '';
        this.load();
      },
      error: (err) => {
        this.submitting.set(false);
        this.toast.error(getApiErrorMessage(err, 'فشل فتح الصندوق'));
      }
    });
  }

  closeRegister(): void {
    const register = this.current();
    if (!register) return;

    this.submitting.set(true);
    this.api.closeCashRegister(register.id, {
      actualClosingBalance: this.closeForm.actualClosingBalance ?? undefined,
      closingNotes: this.closeForm.closingNotes
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toast.success('تم إغلاق الصندوق بنجاح');
        this.closeForm = { actualClosingBalance: null, closingNotes: '' };
        this.load();
      },
      error: (err) => {
        this.submitting.set(false);
        this.toast.error(getApiErrorMessage(err, 'فشل إغلاق الصندوق'));
      }
    });
  }

  variance(): number {
    const register = this.current();
    if (!register || this.closeForm.actualClosingBalance == null) return 0;
    return this.closeForm.actualClosingBalance - register.currentClosingBalance;
  }

  directionClass(transaction: CashRegisterTransaction): string {
    return transaction.direction === 'Outflow' ? 'danger' : 'success';
  }
}
