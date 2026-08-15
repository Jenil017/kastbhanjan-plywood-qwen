import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Users table for authentication
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('user'), // 'admin' or 'user'
  createdAt: text('created_at').notNull(),
});

// Customers table
export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  address: text('address'),
  gstin: text('gstin'),
  balance: real('balance').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Sales table
export const sales = sqliteTable('sales', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id').references(() => customers.id),
  invoiceNo: text('invoice_no').notNull().unique(),
  date: text('date').notNull(),
  totalAmount: real('total_amount').notNull().default(0),
  transportCost: real('transport_cost').default(0),
  paidAmount: real('paid_amount').default(0),
  status: text('status').notNull().default('pending'), // 'pending', 'completed', 'cancelled'
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

// Sale items table (normalized from JSON)
export const saleItems = sqliteTable('sale_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  saleId: integer('sale_id').references(() => sales.id, { onDelete: 'cascade' }),
  category: text('category').notNull(), // Ply, Lafa, Jalav, Chavi Sheet, Khili
  description: text('description'),
  quantity: real('quantity').notNull(),
  unit: text('unit').notNull(), // sqft, kg, piece, etc.
  rate: real('rate').notNull(),
  amount: real('amount').notNull(),
});

// Purchases table (buying wooden scrap from builders)
export const purchases = sqliteTable('purchases', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  supplierName: text('supplier_name').notNull(),
  phone: text('phone'),
  date: text('date').notNull(),
  totalAmount: real('total_amount').notNull().default(0),
  transportCost: real('transport_cost').default(0),
  paidAmount: real('paid_amount').default(0),
  isPaid: integer('is_paid', { mode: 'boolean' }).default(false),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

// Expenses table
export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  category: text('category').notNull(), // Rent, Tax, Bills, Transport, Labour, Other
  description: text('description'),
  amount: real('amount').notNull(),
  date: text('date').notNull(),
  paymentMode: text('payment_mode'), // Cash, UPI, Bank, Cheque
  sourceType: text('source_type'), // 'sale' or 'purchase' for auto-synced transport
  sourceId: integer('source_id'), // Reference to sale.id or purchase.id
  createdAt: text('created_at').notNull(),
});

// Payments table (received from customers)
export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id').references(() => customers.id),
  amount: real('amount').notNull(),
  date: text('date').notNull(),
  paymentMode: text('payment_mode').notNull(), // Cash, UPI, Bank, Cheque
  reference: text('reference'), // Transaction ID, Cheque number, etc.
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

// App settings table
export const appSettings = sqliteTable('app_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value'),
  updatedAt: text('updated_at').notNull(),
});
