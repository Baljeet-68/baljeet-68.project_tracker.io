const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { USE_LIVE_DB } = require('../config');
const localData = !USE_LIVE_DB ? require('../data') : null;

/**
 * GET /leaves/holidays
 * @description Get all public holidays
 */
router.get('/leaves/holidays', authenticate, async (req, res) => {
  try {
    if (USE_LIVE_DB) {
      const [rows] = await pool.query('SELECT * FROM holidays ORDER BY date ASC');
      res.json(rows);
    } else {
      res.json(localData.holidays || []);
    }
  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
});

/**
 * POST /leaves/holidays
 * @description Add a new holiday (Admin only)
 */
router.post('/leaves/holidays', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, date, description } = req.body;
    if (!name || !date) {
      return res.status(400).json({ error: 'Name and date are required' });
    }

    if (USE_LIVE_DB) {
      const [result] = await pool.execute(
        'INSERT INTO holidays (name, date, description) VALUES (?, ?, ?)',
        [name, date, description || '']
      );
      res.status(201).json({ id: result.insertId, name, date, description });
    } else {
      if (!localData.holidays) localData.holidays = [];
      const newHoliday = { id: Date.now(), name, date: new Date(date), description };
      localData.holidays.push(newHoliday);
      res.status(201).json(newHoliday);
    }
  } catch (error) {
    console.error('Error adding holiday:', error);
    res.status(500).json({ error: 'Failed to add holiday' });
  }
});

/**
 * PATCH /leaves/holidays/:id
 * @description Update a holiday (Admin only)
 */
router.patch('/leaves/holidays/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, description } = req.body;

    if (USE_LIVE_DB) {
      const fields = [];
      const values = [];
      if (name !== undefined) { fields.push('name = ?'); values.push(name); }
      if (date !== undefined) { fields.push('date = ?'); values.push(date); }
      if (description !== undefined) { fields.push('description = ?'); values.push(description); }
      
      if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
      
      values.push(id);
      await pool.execute(`UPDATE holidays SET ${fields.join(', ')} WHERE id = ?`, values);
      res.json({ message: 'Holiday updated successfully' });
    } else {
      if (!localData.holidays) return res.status(404).json({ error: 'Holiday not found' });
      const holiday = localData.holidays.find(h => String(h.id) === String(id));
      if (!holiday) return res.status(404).json({ error: 'Holiday not found' });
      
      if (name !== undefined) holiday.name = name;
      if (date !== undefined) holiday.date = new Date(date);
      if (description !== undefined) holiday.description = description;
      
      res.json(holiday);
    }
  } catch (error) {
    console.error('Error updating holiday:', error);
    res.status(500).json({ error: 'Failed to update holiday' });
  }
});

/**
 * DELETE /leaves/holidays/:id
 * @description Delete a holiday (Admin only)
 */
router.delete('/leaves/holidays/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    if (USE_LIVE_DB) {
      await pool.execute('DELETE FROM holidays WHERE id = ?', [id]);
    } else {
      if (localData.holidays) {
        localData.holidays = localData.holidays.filter(h => String(h.id) !== String(id));
      }
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting holiday:', error);
    res.status(500).json({ error: 'Failed to delete holiday' });
  }
});

module.exports = router;
