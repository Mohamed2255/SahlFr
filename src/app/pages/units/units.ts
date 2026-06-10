import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { UnitOfMeasure } from '../../core/models';
import { getApiErrorMessage } from '../../core/utils/helpers';

@Component({
  selector: 'app-units',
  imports: [FormsModule],
  templateUrl: './units.html',
  styleUrl: './units.scss'
})
export class UnitsComponent implements OnInit {
  protected readonly units = signal<UnitOfMeasure[]>([]);
  protected readonly showForm = signal(false);
  form = { id: '', name: '', symbol: '', description: '', isActive: true };

  constructor(private readonly api: ApiService, private readonly toast: ToastService) {}

  ngOnInit(): void {
    this.api.getUnits().subscribe({ next: (u) => this.units.set(u) });
  }

  openCreate(): void {
    this.form = { id: '', name: '', symbol: '', description: '', isActive: true };
    this.showForm.set(true);
  }

  openEdit(u: UnitOfMeasure): void {
    if (u.isSystem) { this.toast.error('لا يمكن تعديل وحدات النظام'); return; }
    this.form = { id: u.id, name: u.name, symbol: u.symbol, description: u.description, isActive: u.isActive };
    this.showForm.set(true);
  }

  save(): void {
    this.api.upsertUnit({ ...this.form, id: this.form.id || undefined }).subscribe({
      next: () => { this.toast.success('تم الحفظ'); this.showForm.set(false); this.ngOnInit(); },
      error: (e) => this.toast.error(getApiErrorMessage(e))
    });
  }

  delete(u: UnitOfMeasure): void {
    if (u.isSystem) { this.toast.error('لا يمكن حذف وحدات النظام'); return; }
    if (!confirm(`حذف "${u.name}"؟`)) return;
    this.api.deleteUnit(u.id).subscribe({
      next: () => { this.toast.success('تم الحذف'); this.ngOnInit(); },
      error: (e) => this.toast.error(getApiErrorMessage(e))
    });
  }
}
