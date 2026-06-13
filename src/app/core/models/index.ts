export interface LoginRequest {
  username: string;
  password: string;
}

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdDate: string;
}

export interface SaleInvoice {
  id: string;
  saleNumber: string;
  saleDate: string;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  notes: string;
  cashierName: string;
  customerName?: string;
  customerMobile?: string;
  previousBalance?: number;
  paymentsApplied?: number;
  newBalance?: number;
  currentAccountBalance?: number;
  items: {
    productName: string;
    unitName: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    subTotal: number;
  }[];
}

export interface LoginResponse {
  token: string;
  username: string;
  fullName: string;
  role: string;
}

export interface ProductUnit {
  id: string;
  unitOfMeasureId?: string;
  name: string;
  conversionFactor: number;
  isBase: boolean;
  costPrice: number;
  sellingPrice: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  description: string;
  imageUrl: string;
  categoryId?: string;
  categoryName?: string;
  minQuantity: number;
  isActive: boolean;
  stockQuantity: number;
  baseUnitName: string;
  units: ProductUnit[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  parentCategoryId?: string;
  parentCategoryName?: string;
  isActive: boolean;
  productCount: number;
}

export interface UnitOfMeasure {
  id: string;
  name: string;
  symbol: string;
  description: string;
  isSystem: boolean;
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  address: string;
  email: string;
  notes: string;
  creditLimit: number;
  balance: number;
  isActive: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  mobile: string;
  address: string;
  email: string;
  notes: string;
  balance: number;
  isActive: boolean;
}

export interface LedgerEntry {
  id: string;
  entryType: string;
  amount: number;
  balanceAfter: number;
  description: string;
  referenceNumber?: string;
  createdDate: string;
}

export interface StockMovement {
  id: string;
  productName: string;
  movementType: string;
  previousQuantity: number;
  newQuantity: number;
  quantityChanged: number;
  reason: string;
  referenceNumber?: string;
  userName?: string;
  createdDate: string;
}

export interface LowStockProduct {
  productId: string;
  name: string;
  sku: string;
  currentQuantity: number;
  minQuantity: number;
  baseUnitName: string;
}

export interface TransactionItem {
  productId: string;
  productUnitId: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
}

export interface CreateSaleRequest {
  customerId?: string;
  discountAmount?: number;
  taxAmount?: number;
  paidAmount?: number;
  paymentMethod?: number;
  notes?: string;
  items: TransactionItem[];
}

export interface CreatePurchaseRequest {
  vendorId?: string;
  discountAmount?: number;
  taxAmount?: number;
  paidAmount?: number;
  paymentMethod?: number;
  notes?: string;
  items: TransactionItem[];
  expenses?: { description: string; amount: number }[];
}

export interface UpdateSaleRequest extends CreateSaleRequest {
  reason: string;
}

export interface UpdatePurchaseRequest extends CreatePurchaseRequest {
  reason: string;
}

export interface PurchaseExpenseLine {
  id?: string;
  description: string;
  amount: number;
}

export interface SaleLineItem {
  id: string;
  productName: string;
  unitName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  subTotal: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  saleDate: string;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  notes: string;
  cashierName: string;
  customerName?: string;
  itemsCount: number;
  items: SaleLineItem[];
}

export interface PurchaseLineItem {
  id: string;
  productName: string;
  unitName: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  purchaseDate: string;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  notes: string;
  purchaserName: string;
  vendorName?: string;
  itemsCount: number;
  items: PurchaseLineItem[];
  expenses?: PurchaseExpenseLine[];
  expensesTotal?: number;
}

export interface DashboardData {
  todaySales: number;
  todayPurchases: number;
  totalRevenue: number;
  totalProfit: number;
  inventoryValue: number;
  customerDebts: number;
  vendorPayables: number;
  lowStockCount: number;
  productsCount: number;
  topSellingProducts: { productName: string; quantitySold: number; revenue: number }[];
  recentTransactions: { type: string; number: string; amount: number; date: string }[];
  salesChart: { label: string; amount: number }[];
}

export interface SaleReportItem {
  saleId: string;
  saleNumber: string;
  saleDate: string;
  cashierName: string;
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
}

export interface ProfitReport {
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  sales: SaleReportItem[];
}

export interface SalesReport {
  period: string;
  totalSales: number;
  invoiceCount: number;
}

export interface InventoryValuation {
  productId: string;
  name: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
}

export interface AgingItem {
  id: string;
  name: string;
  balance: number;
  daysOutstanding: number;
}

export interface CreateProductRequest {
  name: string;
  sku: string;
  barcode: string;
  description: string;
  imageUrl: string;
  categoryId?: string;
  minQuantity: number;
  initialQuantity: number;
  units: {
    unitOfMeasureId?: string;
    name: string;
    conversionFactor: number;
    isBase: boolean;
    costPrice: number;
    sellingPrice: number;
  }[];
}

export interface UpdateProductRequest {
  name: string;
  sku: string;
  barcode: string;
  description: string;
  imageUrl: string;
  categoryId?: string;
  minQuantity: number;
  isActive: boolean;
}

export interface CartLine {
  product: Product;
  unit: ProductUnit;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
}

export interface VoucherAllocation {
  saleId?: string;
  purchaseId?: string;
  amount: number;
}

export interface ReceiptVoucher {
  id: string;
  voucherNumber: string;
  voucherDate: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: string;
  chequeNumber?: string;
  bankReference?: string;
  notes: string;
  status: string;
  createdByName: string;
  allocations: VoucherAllocation[];
}

export interface PaymentVoucher {
  id: string;
  voucherNumber: string;
  voucherDate: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  paymentMethod: string;
  chequeNumber?: string;
  bankReference?: string;
  notes: string;
  status: string;
  createdByName: string;
  allocations: { purchaseId?: string; amount: number }[];
}

export interface UpsertReceiptVoucherRequest {
  id?: string;
  customerId: string;
  voucherDate?: string;
  amount: number;
  paymentMethod: number;
  chequeNumber?: string;
  bankReference?: string;
  notes?: string;
  allocations?: { saleId?: string; amount: number }[];
  postImmediately?: boolean;
}

export interface UpsertPaymentVoucherRequest {
  id?: string;
  vendorId: string;
  voucherDate?: string;
  amount: number;
  paymentMethod: number;
  chequeNumber?: string;
  bankReference?: string;
  notes?: string;
  allocations?: { purchaseId?: string; amount: number }[];
  postImmediately?: boolean;
}

export interface ApiError {
  message?: string;
  Message?: string;
}

export const PaymentMethods = [
  { value: 0, label: 'نقدي' },
  { value: 1, label: 'بطاقة' },
  { value: 2, label: 'تحويل بنكي' },
  { value: 3, label: 'آجل' },
  { value: 4, label: 'مختلط' },
  { value: 5, label: 'شيك' },
  { value: 6, label: 'أخرى' }
];
