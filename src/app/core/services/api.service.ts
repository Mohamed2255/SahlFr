import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  AgingItem,
  AppUser,
  Category,
  CreateProductRequest,
  CreatePurchaseRequest,
  CreateSaleRequest,
  Customer,
  DashboardData,
  InventoryValuation,
  LedgerEntry,
  LowStockProduct,
  Product,
  ProfitReport,
  Purchase,
  Sale,
  SaleInvoice,
  SalesReport,
  StockMovement,
  UnitOfMeasure,
  UpdateProductRequest,
  Vendor
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  getDashboard() {
    return this.http.get<DashboardData>(`${environment.apiUrl}/Dashboard`);
  }

  getProducts(search?: string, includeInactive = false) {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (includeInactive) params = params.set('includeInactive', 'true');
    return this.http.get<Product[]>(`${environment.apiUrl}/Products`, { params });
  }

  getProductByBarcode(barcode: string) {
    return this.http.get<Product>(`${environment.apiUrl}/Products/barcode/${encodeURIComponent(barcode)}`);
  }

  createProduct(request: CreateProductRequest) {
    return this.http.post<{ id: string }>(`${environment.apiUrl}/Products`, request);
  }

  updateProduct(id: string, request: UpdateProductRequest) {
    return this.http.put(`${environment.apiUrl}/Products/${id}`, request);
  }

  deleteProduct(id: string) {
    return this.http.delete(`${environment.apiUrl}/Products/${id}`);
  }

  getCategories() {
    return this.http.get<Category[]>(`${environment.apiUrl}/Categories`);
  }

  upsertCategory(data: Partial<Category> & { id?: string }) {
    return this.http.post<{ id: string }>(`${environment.apiUrl}/Categories`, data);
  }

  deleteCategory(id: string) {
    return this.http.delete(`${environment.apiUrl}/Categories/${id}`);
  }

  getUnits() {
    return this.http.get<UnitOfMeasure[]>(`${environment.apiUrl}/Units`);
  }

  upsertUnit(data: Partial<UnitOfMeasure> & { id?: string }) {
    return this.http.post<{ id: string }>(`${environment.apiUrl}/Units`, data);
  }

  deleteUnit(id: string) {
    return this.http.delete(`${environment.apiUrl}/Units/${id}`);
  }

  getCustomers() {
    return this.http.get<Customer[]>(`${environment.apiUrl}/Customers`);
  }

  upsertCustomer(data: Partial<Customer> & { id?: string }) {
    return this.http.post<{ id: string }>(`${environment.apiUrl}/Customers`, data);
  }

  getCustomerLedger(id: string) {
    return this.http.get<LedgerEntry[]>(`${environment.apiUrl}/Customers/${id}/ledger`);
  }

  recordCustomerPayment(customerId: string, amount: number, description?: string) {
    return this.http.post(`${environment.apiUrl}/Customers/payment`, { customerId, amount, description });
  }

  getVendors() {
    return this.http.get<Vendor[]>(`${environment.apiUrl}/Vendors`);
  }

  upsertVendor(data: Partial<Vendor> & { id?: string }) {
    return this.http.post<{ id: string }>(`${environment.apiUrl}/Vendors`, data);
  }

  getVendorLedger(id: string) {
    return this.http.get<LedgerEntry[]>(`${environment.apiUrl}/Vendors/${id}/ledger`);
  }

  recordVendorPayment(vendorId: string, amount: number, description?: string) {
    return this.http.post(`${environment.apiUrl}/Vendors/payment`, { vendorId, amount, description });
  }

  getStockMovements(productId?: string) {
    let params = new HttpParams();
    if (productId) params = params.set('productId', productId);
    return this.http.get<StockMovement[]>(`${environment.apiUrl}/Inventory/movements`, { params });
  }

  getLowStock() {
    return this.http.get<LowStockProduct[]>(`${environment.apiUrl}/Inventory/low-stock`);
  }

  adjustStock(productId: string, newQuantity: number, reason: string) {
    return this.http.post(`${environment.apiUrl}/Inventory/adjust`, { productId, newQuantity, reason });
  }

  getUsers() {
    return this.http.get<AppUser[]>(`${environment.apiUrl}/Users`);
  }

  upsertUser(data: {
    id?: string;
    username: string;
    fullName: string;
    password?: string;
    role: string;
    isActive: boolean;
  }) {
    return this.http.post<{ id: string }>(`${environment.apiUrl}/Users`, data);
  }

  deleteUser(id: string) {
    return this.http.delete(`${environment.apiUrl}/Users/${id}`);
  }

  getSales() {
    return this.http.get<Sale[]>(`${environment.apiUrl}/Sales`);
  }

  getSaleById(id: string) {
    return this.http.get<SaleInvoice>(`${environment.apiUrl}/Sales/${id}`);
  }

  createSale(request: CreateSaleRequest) {
    return this.http.post<{ id: string }>(`${environment.apiUrl}/Sales`, request);
  }

  getPurchases() {
    return this.http.get<Purchase[]>(`${environment.apiUrl}/Purchases`);
  }

  createPurchase(request: CreatePurchaseRequest) {
    return this.http.post<{ id: string }>(`${environment.apiUrl}/Purchases`, request);
  }

  getProfitReport(startDate?: string, endDate?: string) {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<ProfitReport>(`${environment.apiUrl}/Reports/profit`, { params });
  }

  getSalesReport(period = 'daily', startDate?: string, endDate?: string) {
    let params = new HttpParams().set('period', period);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<SalesReport[]>(`${environment.apiUrl}/Reports/sales`, { params });
  }

  getInventoryValuation() {
    return this.http.get<InventoryValuation[]>(`${environment.apiUrl}/Reports/inventory-valuation`);
  }

  getCustomerAging() {
    return this.http.get<AgingItem[]>(`${environment.apiUrl}/Reports/customer-aging`);
  }

  getVendorAging() {
    return this.http.get<AgingItem[]>(`${environment.apiUrl}/Reports/vendor-aging`);
  }
}
