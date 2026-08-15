import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { z } from 'zod';
import { db } from './db';
import * as schema from './schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';

const app = new Hono();

// CORS middleware
app.use('/*', cors({
  origin: ['https://your-domain.vercel.app', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// JWT middleware for protected routes
const jwtMiddleware = jwt({
  secret: process.env.JWT_SECRET!,
});

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

const customerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^\d{10}$/),
  address: z.string().optional(),
  gstin: z.string().optional(),
});

const saleSchema = z.object({
  customerId: z.number().int().positive(),
  items: z.array(z.object({
    category: z.string(),
    description: z.string().optional(),
    quantity: z.number().positive(),
    unit: z.string(),
    rate: z.number().positive(),
    amount: z.number().positive(),
  })),
  transportCost: z.number().nonnegative().optional(),
  paidAmount: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

// Health check
app.get('/health', (c) => {
  return c.json({ success: true, message: 'API is running' });
});

// Auth routes
app.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    const validation = loginSchema.safeParse(body);
    
    if (!validation.success) {
      return c.json({ 
        success: false, 
        error: 'Invalid input',
        details: validation.error.errors 
      }, 400);
    }

    const { username, password } = validation.data;

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(schema.users.username, username),
    });

    if (!user) {
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }

    // Verify password (using bcrypt in production)
    // For now, simple comparison - implement bcrypt in production
    const isValid = password === user.passwordHash; // Replace with bcrypt.compare
    
    if (!isValid) {
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }

    // Generate JWT token
    const token = await c.jwtSign({
      sub: user.id.toString(),
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
    });

    return c.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Customers routes
app.get('/api/customers', jwtMiddleware, async (c) => {
  try {
    const customers = await db.query.customers.findMany({
      orderBy: [desc(schema.customers.createdAt)],
    });

    return c.json({ success: true, data: customers });
  } catch (error) {
    console.error('Get customers error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

app.get('/api/customers/:id', jwtMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    const customer = await db.query.customers.findFirst({
      where: eq(schema.customers.id, id),
    });

    if (!customer) {
      return c.json({ success: false, error: 'Customer not found' }, 404);
    }

    return c.json({ success: true, data: customer });
  } catch (error) {
    console.error('Get customer error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

app.post('/api/customers', jwtMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const validation = customerSchema.safeParse(body);
    
    if (!validation.success) {
      return c.json({ 
        success: false, 
        error: 'Invalid input',
        details: validation.error.errors 
      }, 400);
    }

    const customer = await db.insert(schema.customers).values({
      ...validation.data,
      balance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning();

    return c.json({ success: true, data: customer[0] }, 201);
  } catch (error) {
    console.error('Create customer error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

app.put('/api/customers/:id', jwtMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const validation = customerSchema.partial().safeParse(body);
    
    if (!validation.success) {
      return c.json({ 
        success: false, 
        error: 'Invalid input',
        details: validation.error.errors 
      }, 400);
    }

    await db.update(schema.customers)
      .set({
        ...validation.data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.customers.id, id));

    const updated = await db.query.customers.findFirst({
      where: eq(schema.customers.id, id),
    });

    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update customer error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

app.delete('/api/customers/:id', jwtMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    await db.delete(schema.customers).where(eq(schema.customers.id, id));

    return c.json({ success: true, message: 'Customer deleted' });
  } catch (error) {
    console.error('Delete customer error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Sales routes
app.get('/api/sales', jwtMiddleware, async (c) => {
  try {
    const sales = await db.query.sales.findMany({
      with: {
        items: true,
        customer: true,
      },
      orderBy: [desc(schema.sales.createdAt)],
      limit: 50,
    });

    return c.json({ success: true, data: sales });
  } catch (error) {
    console.error('Get sales error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

app.post('/api/sales', jwtMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const validation = saleSchema.safeParse(body);
    
    if (!validation.success) {
      return c.json({ 
        success: false, 
        error: 'Invalid input',
        details: validation.error.errors 
      }, 400);
    }

    const { customerId, items, transportCost = 0, paidAmount = 0, notes } = validation.data;
    
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0) + transportCost;

    // Create sale with items in a transaction
    const sale = await db.transaction(async (tx) => {
      const [newSale] = await tx.insert(schema.sales).values({
        customerId,
        invoiceNo: `INV-${Date.now()}`,
        date: new Date().toISOString(),
        totalAmount,
        transportCost,
        paidAmount,
        status: 'completed',
        notes,
        createdAt: new Date().toISOString(),
      }).returning();

      // Insert sale items
      for (const item of items) {
        await tx.insert(schema.saleItems).values({
          saleId: newSale.id,
          ...item,
        });
      }

      // Update customer balance
      const dueAmount = totalAmount - paidAmount;
      await tx.update(schema.customers)
        .set({ 
          balance: sql`${schema.customers.balance} + ${dueAmount}`,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.customers.id, customerId));

      // Auto-create expense for transport cost
      if (transportCost > 0) {
        await tx.insert(schema.expenses).values({
          category: 'Transport',
          description: `Transport cost for Sale #${newSale.id}`,
          amount: transportCost,
          date: new Date().toISOString(),
          sourceType: 'sale',
          sourceId: newSale.id,
          createdAt: new Date().toISOString(),
        });
      }

      return newSale;
    });

    return c.json({ success: true, data: sale }, 201);
  } catch (error) {
    console.error('Create sale error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Dashboard stats
app.get('/api/dashboard', jwtMiddleware, async (c) => {
  try {
    // Get totals
    const totalSales = await db.select({
      total: sql<number>`SUM(${schema.sales.totalAmount})`,
    }).from(schema.sales);

    const totalPurchases = await db.select({
      total: sql<number>`SUM(${schema.purchases.totalAmount})`,
    }).from(schema.purchases);

    const totalExpenses = await db.select({
      total: sql<number>`SUM(${schema.expenses.amount})`,
    }).from(schema.expenses);

    const totalPayments = await db.select({
      total: sql<number>`SUM(${schema.payments.amount})`,
    }).from(schema.payments);

    // Get receivables (positive customer balances)
    const receivables = await db.select({
      total: sql<number>`SUM(CASE WHEN ${schema.customers.balance} > 0 THEN ${schema.customers.balance} ELSE 0 END)`,
    }).from(schema.customers);

    // Get payables (negative customer balances)
    const payables = await db.select({
      total: sql<number>`SUM(CASE WHEN ${schema.customers.balance} < 0 THEN ABS(${schema.customers.balance}) ELSE 0 END)`,
    }).from(schema.customers);

    // Calculate profit
    const salesTotal = totalSales[0]?.total || 0;
    const purchasesTotal = totalPurchases[0]?.total || 0;
    const expensesTotal = totalExpenses[0]?.total || 0;
    const profit = salesTotal - purchasesTotal - expensesTotal;

    // Get recent activity
    const recentSales = await db.query.sales.findMany({
      limit: 5,
      orderBy: [desc(schema.sales.createdAt)],
    });

    return c.json({
      success: true,
      data: {
        totalSales: salesTotal,
        totalPurchases: purchasesTotal,
        totalExpenses: expensesTotal,
        receivables: receivables[0]?.total || 0,
        payables: payables[0]?.total || 0,
        profit,
        recentActivity: recentSales,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

export default app;
