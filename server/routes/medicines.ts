import { Router, Request, Response } from 'express';
import { query, queryOne } from '../db/mysql.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from './auth.js';
import { logAuditEvent } from '../db/mongodb.js';

export const medicinesRouter = Router();

/**
 * GET /api/medicines
 */
medicinesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { search, category, low_stock } = req.query;
    let sql = 'SELECT id, name, category, price, in_stock, created_at FROM Medicine';
    const params: any[] = [];
    const conditions: string[] = [];

    if (search) {
      conditions.push('(name LIKE ? OR category LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    if (low_stock === 'true') {
      conditions.push('in_stock <= 50');
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY name ASC';

    const meds = await query(sql, params);
    return res.json(meds);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/medicines (Admin only)
 */
medicinesRouter.post('/', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, category, price, in_stock } = req.body;
    if (!name || !category || price === undefined || in_stock === undefined) {
      return res.status(400).json({ error: 'Name, category, price, and in_stock are required.' });
    }

    const result: any = await query(
      'INSERT INTO Medicine (name, category, price, in_stock) VALUES (?, ?, ?, ?)',
      [name, category, Number(price), Number(in_stock)]
    );

    await logAuditEvent(req.user?.email || 'admin', 'admin', 'INSERT', 'Medicine', result.insertId, {
      name,
      category,
      price: Number(price),
      in_stock: Number(in_stock)
    });

    return res.status(201).json({
      message: 'Medicine added to inventory.',
      id: result.insertId
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/medicines/:id
 */
medicinesRouter.put('/:id', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category, price, in_stock } = req.body;

    await query(
      `UPDATE Medicine
       SET name = COALESCE(?, name),
           category = COALESCE(?, category),
           price = COALESCE(?, price),
           in_stock = COALESCE(?, in_stock)
       WHERE id = ?`,
      [name, category, price !== undefined ? Number(price) : null, in_stock !== undefined ? Number(in_stock) : null, id]
    );

    await logAuditEvent(req.user?.email || 'admin', 'admin', 'UPDATE', 'Medicine', id, {
      name,
      price,
      in_stock
    });

    return res.json({ message: 'Medicine updated successfully.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/medicines/:id/adjust-stock
 * Uses Stored Procedure `sp_update_medicine_stock`
 */
medicinesRouter.post('/:id/adjust-stock', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity_change } = req.body;

    if (quantity_change === undefined) {
      return res.status(400).json({ error: 'quantity_change is required (positive to add, negative to reduce).' });
    }

    await query('CALL sp_update_medicine_stock(?, ?, @new_stock, @code, @msg)', [
      Number(id),
      Number(quantity_change)
    ]);

    const result = await queryOne<any>('SELECT @new_stock AS new_stock, @code AS status_code, @msg AS message');

    if (result && result.status_code !== 200) {
      return res.status(result.status_code || 400).json({ error: result.message });
    }

    await logAuditEvent(req.user?.email || 'admin', 'admin', 'UPDATE', 'Medicine', id, {
      quantity_change: Number(quantity_change),
      new_stock: result.new_stock
    });

    return res.json({
      message: result.message || 'Stock adjusted successfully.',
      new_stock: result.new_stock
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});
