import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LowStockProduct, Product, StockMovement } from '../../core/models';
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
      next: (p) => { this.products.set(p); this.loading.set(false); },
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
    this.api.adjustStock(this.adjustForm.productId, this.adjustForm.newQuantity, this.adjustForm.reason).subscribe({
      next: () => {
        this.toast.success('تم تعديل المخزون');
        this.showAdjust.set(false);
        this.load();
      },
      error: (e) => this.toast.error(getApiErrorMessage(e))
    });
  }
}
