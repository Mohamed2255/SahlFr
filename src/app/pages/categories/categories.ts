import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Category } from '../../core/models';
import { getApiErrorMessage } from '../../core/utils/helpers';

@Component({
  selector: 'app-categories',
  imports: [FormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.scss'
})
export class CategoriesComponent implements OnInit {
  protected readonly categories = signal<Category[]>([]);
  protected readonly showForm = signal(false);
  form = { id: '', name: '', description: '', parentCategoryId: '', isActive: true };

  constructor(private readonly api: ApiService, private readonly toast: ToastService) {}

  ngOnInit(): void {
    this.api.getCategories().subscribe({ next: (c) => this.categories.set(c) });
  }

  openCreate(): void {
    this.form = { id: '', name: '', description: '', parentCategoryId: '', isActive: true };
    this.showForm.set(true);
  }

  openEdit(c: Category): void {
    this.form = { id: c.id, name: c.name, description: c.description, parentCategoryId: c.parentCategoryId ?? '', isActive: c.isActive };
    this.showForm.set(true);
  }

  save(): void {
    this.api.upsertCategory({ ...this.form, id: this.form.id || undefined, parentCategoryId: this.form.parentCategoryId || undefined }).subscribe({
      next: () => { this.toast.success('تم الحفظ'); this.showForm.set(false); this.ngOnInit(); },
      error: (e) => this.toast.error(getApiErrorMessage(e))
    });
  }

  delete(c: Category): void {
    if (!confirm(`حذف "${c.name}"؟`)) return;
    this.api.deleteCategory(c.id).subscribe({
      next: () => { this.toast.success('تم الحذف'); this.ngOnInit(); },
      error: (e) => this.toast.error(getApiErrorMessage(e))
    });
  }
}
