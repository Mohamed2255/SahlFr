import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
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
  protected readonly editingSaleId = signal<string | null>(null);
  editReason = '';
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
    protected readonly auth: AuthService,
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
        const unit = product.units.reduce((max, u) => u.conversionFactor > max.conversionFactor ? u : max, product.units[0]);
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
    const unit = product.units.reduce((max, u) => u.conversionFactor > max.conversionFactor ? u : max, product.units[0]);
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

  updateCartQuantity(index: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(index);
      return;
    }
    this.cart.update((lines) =>
      lines.map((line, i) => (i === index ? { ...line, quantity } : line))
    );
  }

  updateCartPrice(index: number, unitPrice: number): void {
    if (unitPrice < 0) return;
    this.cart.update((lines) =>
      lines.map((line, i) => (i === index ? { ...line, unitPrice } : line))
    );
  }

  updateCartUnit(index: number, unitId: string): void {
    this.cart.update((lines) =>
      lines.map((line, i) => {
        if (i !== index) return line;
        const newUnit = line.product.units.find((u) => u.id === unitId);
        if (!newUnit) return line;
        return { ...line, unit: newUnit, unitPrice: newUnit.sellingPrice };
      })
    );
  }

  onCartQtyKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const next = (event.target as HTMLElement).closest('tr')?.nextElementSibling?.querySelector('input.qty-input') as HTMLInputElement | null;
      next?.focus();
      next?.select();
    }
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

    if (this.editingSaleId()) {
      if (!this.editReason.trim()) {
        this.toast.error('سبب التعديل مطلوب');
        return;
      }
      this.submitting.set(true);
      this.api.updateSale(this.editingSaleId()!, {
        customerId: this.selectedCustomerId || undefined,
        discountAmount: this.invoiceDiscount,
        taxAmount: this.taxAmount,
        paidAmount: this.paidAmount,
        paymentMethod: this.paymentMethod,
        notes: this.notes,
        reason: this.editReason,
        items: this.cart().map((l) => ({
          productId: l.product.id,
          productUnitId: l.unit.id,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discountAmount: l.discountAmount ?? 0
        }))
      }).subscribe({
        next: () => {
          this.submitting.set(false);
          this.toast.success('تم تعديل الفاتورة');
          this.resetCart();
          this.loadData();
        },
        error: (err) => {
          this.submitting.set(false);
          this.toast.error(getApiErrorMessage(err, 'فشل تعديل الفاتورة'));
        }
      });
      return;
    }

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
          this.resetCart();
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

  loadSaleForEdit(sale: Sale): void {
    this.editingSaleId.set(sale.id);
    this.editReason = '';
    this.invoiceDiscount = sale.discountAmount;
    this.taxAmount = sale.taxAmount;
    this.paidAmount = sale.paidAmount;
    this.notes = sale.notes;
    this.paymentMethod = PaymentMethods.find((m) => m.label === sale.paymentMethod)?.value ?? 0;
    this.selectedCustomerId = this.customers().find((c) => c.name === sale.customerName)?.id ?? '';
    this.cart.set(
      sale.items.map((item) => {
        const product = this.products().find((p) => p.name === item.productName)!;
        const unit = product.units.find((u) => u.name === item.unitName)!;
        return { product, unit, quantity: item.quantity, unitPrice: item.unitPrice, discountAmount: item.discountAmount };
      })
    );
    this.toast.success('تم تحميل الفاتورة للتعديل');
  }

  resetCart(): void {
    this.cart.set([]);
    this.invoiceDiscount = 0;
    this.taxAmount = 0;
    this.paidAmount = 0;
    this.notes = '';
    this.editingSaleId.set(null);
    this.editReason = '';
  }
}
