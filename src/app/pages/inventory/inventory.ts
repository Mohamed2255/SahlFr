import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LowStockProduct, Product, ProductUnit, StockMovement } from '../../core/models';
import { formatDate, getApiErrorMessage } from '../../core/utils/helpers';

@Component({
  selector: 'app-inventory',
  imports: [FormsModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss'
})
export class InventoryComponent implements OnInit {
  protected readonly loading = signal(true);
  protected readonly tab = signal<'stock' | 'movements' | 'alerts'>('stock');
  protected readonly products = signal<Product[]>([]);
  protected readonly movements = signal<StockMovement[]>([]);
  protected readonly lowStock = signal<LowStockProduct[]>([]);
  protected readonly showAdjust = signal(false);
  protected readonly priceDrafts = signal<Record<string, number>>({});
  protected readonly savingPriceUnitId = signal<string | null>(null);
  protected readonly formatDate = formatDate;

  adjustForm = { productId: '', newQuantity: 0, reason: '' };

  constructor(
    protected readonly auth: AuthService,
    private readonly api: ApiService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getProducts().subscribe({
      next: (p) => {
        this.products.set(p);
        this.priceDrafts.set(this.buildPriceDrafts(p));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
    this.api.getStockMovements().subscribe({ next: (m) => this.movements.set(m) });
    this.api.getLowStock().subscribe({ next: (l) => this.lowStock.set(l) });
  }

  openAdjust(product?: Product): void {
    this.adjustForm = {
      productId: product?.id ?? '',
      newQuantity: product?.stockQuantity ?? 0,
      reason: ''
    };
    this.showAdjust.set(true);
  }

  submitAdjust(): void {
    if (!this.adjustForm.productId) {
      this.toast.error('يرجى اختيار الصنف أولاً.');
      return;
    }
    if (this.adjustForm.newQuantity < 0) {
      this.toast.error('لا يمكن إدخال أرقام سالبة.');
      return;
    }
    this.api.adjustStock(this.adjustForm.productId, this.adjustForm.newQuantity, this.adjustForm.reason).subscribe({
      next: () => {
        this.toast.success('تم تعديل المخزون');
        this.showAdjust.set(false);
        this.load();
      },
      error: (e) => this.toast.error(getApiErrorMessage(e))
    });
  }

  priceDraft(unitId: string): number {
    return this.priceDrafts()[unitId] ?? 0;
  }

  setPriceDraft(unitId: string, value: number | string): void {
    const parsed = Number(value);
    this.priceDrafts.update((drafts) => ({
      ...drafts,
      [unitId]: Number.isFinite(parsed) ? parsed : 0
    }));
  }

  saveSellingPrice(product: Product, unit: ProductUnit): void {
    const sellingPrice = this.priceDraft(unit.id);
    if (sellingPrice < 0) {
      this.toast.error('لا يمكن إدخال أرقام سالبة.');
      return;
    }

    if (sellingPrice === unit.sellingPrice || this.savingPriceUnitId() === unit.id) return;

    this.savingPriceUnitId.set(unit.id);
    this.api.updateProductUnitSellingPrice(product.id, unit.id, sellingPrice).subscribe({
      next: () => {
        this.products.update((products) =>
          products.map((p) =>
            p.id === product.id
              ? {
                  ...p,
                  units: p.units.map((u) => (u.id === unit.id ? { ...u, sellingPrice } : u))
                }
              : p
          )
        );
        this.savingPriceUnitId.set(null);
        this.toast.success('تم تحديث سعر البيع');
      },
      error: (err) => {
        this.savingPriceUnitId.set(null);
        this.setPriceDraft(unit.id, unit.sellingPrice);
        this.toast.error(getApiErrorMessage(err, 'فشل تحديث سعر البيع'));
      }
    });
  }

  private buildPriceDrafts(products: Product[]): Record<string, number> {
    return products.reduce<Record<string, number>>((drafts, product) => {
      product.units.forEach((unit) => {
        drafts[unit.id] = unit.sellingPrice;
      });
      return drafts;
    }, {});
  }
}
