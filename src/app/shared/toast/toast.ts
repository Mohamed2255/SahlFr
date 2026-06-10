import { Component } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast-{{ toast.type }}" (click)="toastService.dismiss(toast.id)">
          {{ toast.message }}
        </div>
      }
    </div>
  `,
  styles: `
    .toast-container {
      position: fixed;
      top: 1.25rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      padding: 0.85rem 1.25rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9rem;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease;
      cursor: pointer;
      min-width: 280px;
      text-align: center;
    }
    .toast-success {
      background: #059669;
      color: #fff;
    }
    .toast-error {
      background: #dc2626;
      color: #fff;
    }
    .toast-info {
      background: var(--accent);
      color: #fff;
    }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `
})
export class ToastComponent {
  constructor(protected readonly toastService: ToastService) {}
}
