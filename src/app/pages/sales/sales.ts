import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CartLine, Product, ProductUnit, Sale } from '../../core/models';
import { formatCurrency, formatDate, getApiErrorMessage } from '../../core/utils/helpers';

@Component({
  selector: 'app-sales',
  imports: [FormsModule],
  templateUrl: './sales.html',
  styleUrl: './sales.scss'
})
export class SalesComponent implements OnInit {
  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly products = signal<Product[]>([]);
  protected readonly sales = signal<Sale[]>([]);
  protected readonly cart = signal<CartLine[]>([]);
  protected readonly expandedSaleId = signal<string | null>(null);

  protected readonly formatCurrency = formatCurrency;
  protected readonly formatDate = formatDate;

  selectedProductId = '';
  selectedUnitId = '';
  quantity = 1;
  unitPrice = 0;

  constructor(private readonly api: ApiService) {}

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

    this.api.getSales().subscribe({
      next: (sales) => this.sales.set(sales)
    });
  }

  selectedProduct(): Product | undefined {
    return this.products().find((product) => product.id === this.selectedProductId);
  }

  availableUnits(): ProductUnit[] {
    return this.selectedProduct()?.units ?? [];
  }

  onProductChange(): void {
    const product = this.selectedProduct();
    const firstUnit = product?.units[0];
    this.selectedUnitId = firstUnit?.id ?? '';
    this.unitPrice = firstUnit?.sellingPrice ?? 0;
  }

  onUnitChange(): void {
    const unit = this.availableUnits().find((item) => item.id === this.selectedUnitId);
    this.unitPrice = unit?.sellingPrice ?? 0;
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

  cartTotal(): number {
    return this.cart().reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  }

  submitSale(): void {
    if (!this.cart().length) {
      this.error.set('أضف منتجاً واحداً على الأقل');
      return;
    }

    this.submitting.set(true);
    this.error.set('');
    this.success.set('');

    this.api
      .createSale({
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
          this.success.set('تم تسجيل عملية البيع بنجاح');
          this.cart.set([]);
          this.loadData();
        },
        error: (err) => {
          this.submitting.set(false);
          this.error.set(getApiErrorMessage(err, 'فشل تسجيل عملية البيع'));
        }
      });
  }

  toggleSaleDetails(saleId: string): void {
    this.expandedSaleId.update((current) => (current === saleId ? null : saleId));
  }
}
