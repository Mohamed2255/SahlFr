import { Component, input } from '@angular/core';
import { SaleInvoice } from '../../core/models';
import { formatCurrency, formatDate } from '../../core/utils/helpers';

@Component({
  selector: 'app-invoice-print',
  templateUrl: './invoice-print.html',
  styleUrl: './invoice-print.scss'
})
export class InvoicePrintComponent {
  readonly invoice = input.required<SaleInvoice>();
  protected readonly formatCurrency = formatCurrency;
  protected readonly formatDate = formatDate;

  print(): void {
    window.print();
  }
}
