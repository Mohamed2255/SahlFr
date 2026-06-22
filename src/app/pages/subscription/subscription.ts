import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SubscriptionService, SubscriptionStatusDto } from '../../core/services/subscription.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { formatDate } from '../../core/utils/helpers';

@Component({
  selector: 'app-subscription',
  imports: [FormsModule],
  templateUrl: './subscription.html',
  styleUrl: './subscription.scss'
})
export class SubscriptionComponent implements OnInit {
  protected subStatus = signal<SubscriptionStatusDto | null>(null);
  protected loading = signal(true);
  protected companyName = signal('');
  protected formatDate = formatDate;

  constructor(
    private subService: SubscriptionService,
    protected auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStatus();
  }

  loadStatus() {
    this.loading.set(true);
    this.subService.getStatus().subscribe({
      next: (s) => {
        this.subStatus.set(s);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('حدث خطأ أثناء جلب بيانات الاشتراك');
      }
    });
  }

  register() {
    if (!this.companyName()) return;
    this.subService.registerCompany(this.companyName()).subscribe({
      next: (res) => {
        this.toast.success(res.message);
        this.loadStatus();
        this.router.navigate(['/']);
      },
      error: (err) => this.toast.error(err.error?.message || 'فشل التسجيل')
    });
  }

  activate() {
    this.subService.activateSubscription().subscribe({
      next: (res) => {
        this.toast.success(res.message);
        this.loadStatus();
      },
      error: () => this.toast.error('فشل التفعيل')
    });
  }

  extend() {
    this.subService.extendTrial(30).subscribe({
      next: (res) => {
        this.toast.success(res.message);
        this.loadStatus();
      },
      error: () => this.toast.error('فشل التمديد')
    });
  }
}
