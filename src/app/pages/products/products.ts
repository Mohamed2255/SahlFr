import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Category, Product, UnitOfMeasure } from '../../core/models';
import { formatCurrency, getApiErrorMessage } from '../../core/utils/helpers';

@Component({
  selector: 'app-products',
  imports: [FormsModule],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class ProductsComponent implements OnInit {
  protected readonly loading = signal(true);
  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly units = signal<UnitOfMeasure[]>([]);
  protected readonly search = signal('');
  protected readonly showModal = signal(false);
  protected readonly editing = signal<Product | null>(null);
  protected readonly formatCurrency = formatCurrency;

  form = {
    name: '', sku: '', barcode: '', description: '', imageUrl: '',
    categoryId: '', minQuantity: 0, initialQuantity: 0, isActive: true,
    unitName: '', costPrice: 0, sellingPrice: 0
  };

  constructor(
    protected readonly auth: AuthService,
    private readonly api: ApiService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
    if (this.auth.isAdmin()) {
      this.api.getCategories().subscribe({ next: (c) => this.categories.set(c) });
      this.api.getUnits().subscribe({ next: (u) => this.units.set(u) });
    }
  }

  load(): void {
    this.loading.set(true);
    this.api.getProducts(undefined, this.auth.isAdmin()).subscribe({
      next: (p) => { this.products.set(p); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  filteredProducts(): Product[] {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.products();
    return this.products().filter((p) =>
      p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term) || p.barcode.includes(term)
    );
  }

  openCreate(): void {
    this.editing.set(null);
    this.form = { name: '', sku: '', barcode: '', description: '', imageUrl: '', categoryId: '', minQuantity: 10, initialQuantity: 0, isActive: true, unitName: 'قطعة', costPrice: 0, sellingPrice: 0 };
    this.showModal.set(true);
  }

  openEdit(product: Product): void {
    this.editing.set(product);
    this.form = {
      name: product.name, sku: product.sku, barcode: product.barcode,
      description: product.description, imageUrl: product.imageUrl,
      categoryId: product.categoryId ?? '', minQuantity: product.minQuantity,
      initialQuantity: product.stockQuantity, isActive: product.isActive,
      unitName: product.baseUnitName, costPrice: product.units.find((u) => u.isBase)?.costPrice ?? 0,
      sellingPrice: product.units.find((u) => u.isBase)?.sellingPrice ?? 0
    };
    this.showModal.set(true);
  }

  save(): void {
    // Validate non-negative numbers
    if (this.form.minQuantity < 0) {
      this.toast.error('لا يمكن إدخال أرقام سالبة.');
      return;
    }

    if (this.editing()) {
      this.api.updateProduct(this.editing()!.id, {
        name: this.form.name, sku: this.form.sku, barcode: this.form.barcode,
        description: this.form.description, imageUrl: this.form.imageUrl,
        categoryId: this.form.categoryId || undefined, minQuantity: this.form.minQuantity,
        isActive: this.form.isActive
      }).subscribe({
        next: () => { this.toast.success('تم تحديث المنتج'); this.showModal.set(false); this.load(); },
        error: (e) => this.toast.error(getApiErrorMessage(e))
      });
    } else {
      if (this.form.initialQuantity < 0) {
        this.toast.error('لا يمكن إدخال أرقام سالبة.');
        return;
      }
      if (this.form.costPrice < 0) {
        this.toast.error('لا يمكن إدخال أرقام سالبة.');
        return;
      }
      if (this.form.sellingPrice < 0) {
        this.toast.error('لا يمكن إدخال أرقام سالبة.');
        return;
      }
      if (this.form.sellingPrice <= this.form.costPrice) {
        this.toast.error('يجب أن يكون سعر البيع أكبر من سعر التكلفة.');
        return;
      }

      this.api.createProduct({
        name: this.form.name, sku: this.form.sku, barcode: this.form.barcode,
        description: this.form.description, imageUrl: this.form.imageUrl,
        categoryId: this.form.categoryId || undefined, minQuantity: this.form.minQuantity,
        initialQuantity: this.form.initialQuantity,
        units: [{ name: this.form.unitName, conversionFactor: 1, isBase: true, costPrice: this.form.costPrice, sellingPrice: this.form.sellingPrice }]
      }).subscribe({
        next: () => { this.toast.success('تم إضافة المنتج'); this.showModal.set(false); this.load(); },
        error: (e) => this.toast.error(getApiErrorMessage(e))
      });
    }
  }

  deleteProduct(product: Product): void {
    if (!confirm(`حذف "${product.name}"؟`)) return;
    this.api.deleteProduct(product.id).subscribe({
      next: () => { this.toast.success('تم الحذف'); this.load(); },
      error: (e) => this.toast.error(getApiErrorMessage(e))
    });
  }
}
