import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { CartLine, Customer, PaymentMethods, Product, ProductUnit, Sale, SaleInvoice } from '../../core/models';
import { InvoicePrintComponent } from '../../shared/invoice-print/invoice-print';
import { formatCurrency, formatDate, getApiErrorMessage } from '../../core/utils/helpers';

@Component({
  selector: 'app-pos',
  imports: [FormsModule, InvoicePrintComponent],
  templateUrl: './pos.html',
  styleUrl: './pos.scss'
})
export class PosComponent implements OnInit {
  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly products = signal<Product[]>([]);
  protected readonly customers = signal<Customer[]>([]);
  protected readonly sales = signal<Sale[]>([]);
  protected readonly cart = signal<CartLine[]>([]);
  protected readonly expandedSaleId = signal<string | null>(null);
  protected readonly invoicePreview = signal<SaleInvoice | null>(null);
  protected readonly showInvoice = signal(false);
  protected readonly formatCurrency = formatCurrency;
  protected readonly formatDate = formatDate;
  protected readonly paymentMethods = PaymentMethods;

  searchTerm = '';
  barcodeInput = '';
  selectedProductId = '';
  selectedUnitId = '';
  selectedCustomerId = '';
  quantity = 1;
  unitPrice = 0;
  itemDiscount = 0;
  invoiceDiscount = 0;
  taxAmount = 0;
  paidAmount = 0;
  paymentMethod = 0;
  notes = '';

  constructor(
    private readonly api: ApiService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.api.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
    this.api.getCustomers().subscribe({ next: (c) => this.customers.set(c.filter((x) => x.isActive)) });
    this.api.getSales().subscribe({ next: (s) => this.sales.set(s) });
  }

  filteredProducts(): Product[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.products();
    return this.products().filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.barcode.includes(term)
    );
  }

  onBarcodeScan(): void {
    const code = this.barcodeInput.trim();
    if (!code) return;
    this.api.getProductByBarcode(code).subscribe({
      next: (product) => {
        this.selectedProductId = product.id;
        const unit = product.units.find((u) => u.isBase) ?? product.units[0];
        if (unit) {
          this.selectedUnitId = unit.id;
          this.unitPrice = unit.sellingPrice;
          this.quantity = 1;
          this.addToCart();
        }
        this.barcodeInput = '';
      },
      error: () => this.toast.error('المنتج غير موجود')
    });
  }

  selectProduct(product: Product): void {
    this.selectedProductId = product.id;
    const unit = product.units.find((u) => u.isBase) ?? product.units[0];
    this.selectedUnitId = unit?.id ?? '';
    this.unitPrice = unit?.sellingPrice ?? 0;
  }

  selectedProduct(): Product | undefined {
    return this.products().find((p) => p.id === this.selectedProductId);
  }

  availableUnits(): ProductUnit[] {
    return this.selectedProduct()?.units ?? [];
  }

  addToCart(): void {
    const product = this.selectedProduct();
    const unit = this.availableUnits().find((u) => u.id === this.selectedUnitId);
    if (!product || !unit || this.quantity <= 0) {
      this.toast.error('يرجى اختيار منتج وكمية صحيحة');
      return;
    }
    const existing = this.cart().find((l) => l.product.id === product.id && l.unit.id === unit.id);
    if (existing) {
      this.cart.update((lines) =>
        lines.map((l) =>
          l === existing
            ? { ...l, quantity: l.quantity + this.quantity, unitPrice: this.unitPrice, discountAmount: this.itemDiscount }
            : l
        )
      );
    } else {
      this.cart.update((lines) => [
        ...lines,
        { product, unit, quantity: this.quantity, unitPrice: this.unitPrice, discountAmount: this.itemDiscount }
      ]);
    }
    this.quantity = 1;
    this.itemDiscount = 0;
  }

  removeFromCart(index: number): void {
    this.cart.update((lines) => lines.filter((_, i) => i !== index));
  }

  subTotal(): number {
    return this.cart().reduce((s, l) => s + l.quantity * l.unitPrice - (l.discountAmount ?? 0), 0);
  }

  total(): number {
    return this.subTotal() - this.invoiceDiscount + this.taxAmount;
  }

  submitSale(): void {
    if (!this.cart().length) {
      this.toast.error('أضف منتجاً واحداً على الأقل');
      return;
    }
    const total = this.total();
    if (this.paidAmount <= 0) this.paidAmount = total;

    this.submitting.set(true);
    this.api
      .createSale({
        customerId: this.selectedCustomerId || undefined,
        discountAmount: this.invoiceDiscount,
        taxAmount: this.taxAmount,
        paidAmount: this.paidAmount,
        paymentMethod: this.paymentMethod,
        notes: this.notes,
        items: this.cart().map((l) => ({
          productId: l.product.id,
          productUnitId: l.unit.id,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discountAmount: l.discountAmount ?? 0
        }))
      })
      .subscribe({
        next: (res) => {
          this.submitting.set(false);
          this.toast.success('تم إنشاء الفاتورة بنجاح');
          this.cart.set([]);
          this.invoiceDiscount = 0;
          this.taxAmount = 0;
          this.paidAmount = 0;
          this.notes = '';
          this.loadData();
          if (res?.id) this.openInvoice(res.id);
        },
        error: (err) => {
          this.submitting.set(false);
          this.toast.error(getApiErrorMessage(err, 'فشل إنشاء الفاتورة'));
        }
      });
  }

  toggleSaleDetails(id: string): void {
    this.expandedSaleId.update((c) => (c === id ? null : id));
  }

  openInvoice(saleId: string): void {
    this.api.getSaleById(saleId).subscribe({
      next: (invoice) => {
        this.invoicePreview.set(invoice);
        this.showInvoice.set(true);
      },
      error: () => this.toast.error('تعذر تحميل الفاتورة')
    });
  }
}
