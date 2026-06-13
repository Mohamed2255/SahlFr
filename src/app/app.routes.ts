import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout').then((m) => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent) },
      { path: 'pos', loadComponent: () => import('./pages/pos/pos').then((m) => m.PosComponent) },
      { path: 'products', loadComponent: () => import('./pages/products/products').then((m) => m.ProductsComponent) },
      { path: 'inventory', loadComponent: () => import('./pages/inventory/inventory').then((m) => m.InventoryComponent) },
      { path: 'customers', loadComponent: () => import('./pages/customers/customers').then((m) => m.CustomersComponent) },
      { path: 'sales', redirectTo: 'pos', pathMatch: 'full' },
      {
        path: 'purchases',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/purchases/purchases').then((m) => m.PurchasesComponent)
      },
      {
        path: 'receipt-vouchers',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/receipt-vouchers/receipt-vouchers').then((m) => m.ReceiptVouchersComponent)
      },
      {
        path: 'payment-vouchers',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/payment-vouchers/payment-vouchers').then((m) => m.PaymentVouchersComponent)
      },
      {
        path: 'vendors',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/vendors/vendors').then((m) => m.VendorsComponent)
      },
      {
        path: 'categories',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/categories/categories').then((m) => m.CategoriesComponent)
      },
      {
        path: 'units',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/units/units').then((m) => m.UnitsComponent)
      },
      {
        path: 'reports',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/reports/reports').then((m) => m.ReportsComponent)
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/users/users').then((m) => m.UsersComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
