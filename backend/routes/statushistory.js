const express = require('express');
const router = express.Router();
const prisma = require('../client');
const authenticateToken = require('../authenticateToken');

router.get('/', authenticateToken, async (req, res) => {
    try {
        const statushistory = await prisma.statusHistory.findMany( {
            select: { id: true, status: true, itemId: true }
        })
        res.json(statushistory);
    } catch(error) {
        res.status(500).json({ error: error.message })
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID format' });

        const statushistory = await prisma.statusHistory.findUnique({
            where: { id },
            select: { id: true, status: true, itemId: true }
        });

        if (!statushistory) return res.status(404).json({ error: 'Item History not found' });
        res.json(statushistory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/item/:itemId', authenticateToken, async (req, res) => {
    try {
        const itemId = parseInt(req.params.itemId);
        if (isNaN(itemId)) return res.status(400).json({ error: 'Invalid ID format' });

        const history = await prisma.statusHistory.findMany({
            where: { itemId },
            orderBy: { changedAt: 'desc' }
        });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;