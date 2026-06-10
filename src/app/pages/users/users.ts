import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { AppUser } from '../../core/models';
import { formatDate, getApiErrorMessage } from '../../core/utils/helpers';

@Component({
  selector: 'app-users',
  imports: [FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class UsersComponent implements OnInit {
  protected readonly users = signal<AppUser[]>([]);
  protected readonly showForm = signal(false);
  protected readonly formatDate = formatDate;

  readonly roles = [
    { value: 'Admin', label: 'مدير' },
    { value: 'Cashier', label: 'أمين صندوق' },
    { value: 'InventoryManager', label: 'مدير مخزون' }
  ];

  form = {
    id: '',
    username: '',
    fullName: '',
    password: '',
    role: 'Cashier',
    isActive: true
  };

  constructor(
    private readonly api: ApiService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.getUsers().subscribe({ next: (u) => this.users.set(u) });
  }

  openCreate(): void {
    this.form = { id: '', username: '', fullName: '', password: '', role: 'Cashier', isActive: true };
    this.showForm.set(true);
  }

  openEdit(user: AppUser): void {
    this.form = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      password: '',
      role: user.role,
      isActive: user.isActive
    };
    this.showForm.set(true);
  }

  save(): void {
    this.api
      .upsertUser({
        id: this.form.id || undefined,
        username: this.form.username,
        fullName: this.form.fullName,
        password: this.form.password || undefined,
        role: this.form.role,
        isActive: this.form.isActive
      })
      .subscribe({
        next: () => {
          this.toast.success('تم حفظ المستخدم');
          this.showForm.set(false);
          this.load();
        },
        error: (e) => this.toast.error(getApiErrorMessage(e))
      });
  }

  deleteUser(user: AppUser): void {
    if (!confirm(`حذف المستخدم "${user.fullName}"؟`)) return;
    this.api.deleteUser(user.id).subscribe({
      next: () => { this.toast.success('تم الحذف'); this.load(); },
      error: (e) => this.toast.error(getApiErrorMessage(e))
    });
  }

  roleLabel(role: string): string {
    return this.roles.find((r) => r.value === role)?.label ?? role;
  }
}
