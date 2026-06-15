import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CartLine, PaymentMethods, Product, ProductUnit, Purchase, Vendor } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';
import { formatCurrency, formatDate, getApiErrorMessage } from '../../core/utils/helpers';

@Component({
  selector: 'app-purchases',
  imports: [FormsModule],
  templateUrl: './purchases.html',
  styleUrl: './purchases.scss'
})
export class PurchasesComponent implements OnInit {
  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly products = signal<Product[]>([]);
  protected readonly purchases = signal<Purchase[]>([]);
  protected readonly cart = signal<CartLine[]>([]);
  protected readonly expandedPurchaseId = signal<string | null>(null);
  protected readonly editingPurchaseId = signal<string | null>(null);
  editReason = '';

  protected readonly formatCurrency = formatCurrency;
  protected readonly formatDate = formatDate;

  selectedProductId = '';
  selectedUnitId = '';
  selectedVendorId = '';
  quantity = 1;
  unitPrice = 0;
  paidAmount = 0;
  paymentMethod = 0;
  protected readonly paymentMethods = PaymentMethods;
  protected readonly vendors = signal<Vendor[]>([]);
  expenses: { description: string; amount: number }[] = [];
  expenseDescription = '';
  expenseAmount = 0;

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

    this.api.getPurchases().subscribe({ next: (purchases) => this.purchases.set(purchases) });
    this.api.getVendors().subscribe({ next: (v) => this.vendors.set(v) });
  }

  selectedProduct(): Product | undefined {
    return this.products().find((product) => product.id === this.selectedProductId);
  }

  availableUnits(): ProductUnit[] {
    return this.selectedProduct()?.units ?? [];
  }

  onProductChange(): void {
    const product = this.selectedProduct();
    const defaultUnit = product?.units?.reduce((max, u) => u.conversionFactor > max.conversionFactor ? u : max, product.units[0]);
    this.selectedUnitId = defaultUnit?.id ?? '';
    this.unitPrice = defaultUnit?.costPrice ?? 0;
  }

  onUnitChange(): void {
    const unit = this.availableUnits().find((item) => item.id === this.selectedUnitId);
    this.unitPrice = unit?.costPrice ?? 0;
  }

  addToCart(): void {
    const product = this.selectedProduct();
    const unit = this.availableUnits().find((item) => item.id === this.selectedUnitId);

    if (!product || !unit || this.quantity <= 0) {
      this.error.set('يرجى اختيار منتج ووحدة وكمية صحيحة');
      return;
    }

    this.error.set('');
    const existing = this.cart().find(
      (line) => line.product.id === product.id && line.unit.id === unit.id
    );

    if (existing) {
      this.cart.update((lines) =>
        lines.map((line) =>
          line === existing
            ? { ...line, quantity: line.quantity + this.quantity, unitPrice: this.unitPrice }
            : line
        )
      );
    } else {
      this.cart.update((lines) => [
        ...lines,
        { product, unit, quantity: this.quantity, unitPrice: this.unitPrice }
      ]);
    }

    this.quantity = 1;
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

  updateCartUnit(index: number, unitId: string): void {
    this.cart.update((lines) =>
      lines.map((line, i) => {
        if (i !== index) return line;
        const newUnit = line.product.units.find((u) => u.id === unitId);
        if (!newUnit) return line;
        return { ...line, unit: newUnit, unitPrice: newUnit.costPrice };
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

  addExpense(): void {
    if (!this.expenseDescription.trim() || this.expenseAmount <= 0) {
      this.error.set('أدخل وصفاً ومبلغاً صحيحاً للمصروف');
      return;
    }
    this.expenses.push({ description: this.expenseDescription.trim(), amount: this.expenseAmount });
    this.expenseDescription = '';
    this.expenseAmount = 0;
    this.error.set('');
  }

  removeExpense(index: number): void {
    this.expenses.splice(index, 1);
  }

  expensesTotal(): number {
    return this.expenses.reduce((sum, e) => sum + e.amount, 0);
  }

  cartTotal(): number {
    return this.cart().reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  }

  submitPurchase(): void {
    if (!this.cart().length) {
      this.error.set('أضف منتجاً واحداً على الأقل');
      return;
    }

    this.submitting.set(true);
    this.error.set('');
    this.success.set('');

    const total = this.cartTotal();
    if (this.paidAmount <= 0) this.paidAmount = total;

    this.api
      .createPurchase({
        vendorId: this.selectedVendorId || undefined,
        paidAmount: this.paidAmount,
        paymentMethod: this.paymentMethod,
        expenses: this.expenses,
        items: this.cart().map((line) => ({
          productId: line.product.id,
          productUnitId: line.unit.id,
          quantity: line.quantity,
          unitPrice: line.unitPrice
        }))
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.success.set('تم تسجيل عملية الشراء بنجاح');
          this.toast.success('تم تسجيل فاتورة الشراء');
          this.cart.set([]);
          this.expenses = [];
          this.paidAmount = 0;
          this.editingPurchaseId.set(null);
          this.loadData();
        },
        error: (err) => {
          this.submitting.set(false);
          this.error.set(getApiErrorMessage(err, 'فشل تسجيل عملية الشراء'));
        }
      });
  }

  togglePurchaseDetails(purchaseId: string): void {
    this.expandedPurchaseId.update((current) => (current === purchaseId ? null : purchaseId));
  }

  startEditPurchase(purchase: Purchase): void {
    this.editingPurchaseId.set(purchase.id);
    this.editReason = '';
    this.selectedVendorId = this.vendors().find((v) => v.name === purchase.vendorName)?.id ?? '';
    this.paymentMethod = PaymentMethods.find((m) => m.label === purchase.paymentMethod)?.value ?? 0;
    this.paidAmount = purchase.paidAmount;
    this.expenses = (purchase.expenses ?? []).map((e) => ({ description: e.description, amount: e.amount }));
    this.cart.set(
      purchase.items.map((item) => {
        const product = this.products().find((p) => p.name === item.productName)!;
        const unit = product.units.find((u) => u.name === item.unitName)!;
        return { product, unit, quantity: item.quantity, unitPrice: item.unitPrice };
      })
    );
    this.expandedPurchaseId.set(purchase.id);
  }

  submitPurchaseUpdate(): void {
    const id = this.editingPurchaseId();
    if (!id || !this.editReason.trim()) {
      this.error.set('سبب التعديل مطلوب');
      return;
    }
    if (!this.cart().length) {
      this.error.set('أضف منتجاً واحداً على الأقل');
      return;
    }

    this.submitting.set(true);
    this.api.updatePurchase(id, {
      vendorId: this.selectedVendorId || undefined,
      paidAmount: this.paidAmount,
      paymentMethod: this.paymentMethod,
      expenses: this.expenses,
      reason: this.editReason,
      items: this.cart().map((line) => ({
        productId: line.product.id,
        productUnitId: line.unit.id,
        quantity: line.quantity,
        unitPrice: line.unitPrice
      }))
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toast.success('تم تعديل فاتورة الشراء');
        this.cart.set([]);
        this.expenses = [];
        this.editingPurchaseId.set(null);
        this.loadData();
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(getApiErrorMessage(err, 'فشل تعديل الفاتورة'));
      }
    });
  }
}
