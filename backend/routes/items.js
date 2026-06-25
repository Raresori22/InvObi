const express = require('express');
const router = express.Router();
const prisma = require('../client');
const authenticateToken = require('../authenticateToken');

// define the home page route
router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await prisma.item.findMany({
        include: { gestiune: true, location: true, category: true, responsible: true, statusHistory: true }
    })
    res.json(items)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID format' });

        const item = await prisma.item.findUnique({
            where: { id },
            include: { gestiune: true, location: true, category: true, responsible: true, description: true, statusHistory: true }
        });

        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json(item);
    } catch (error) {   
        res.status(500).json({ error: error.message });
    }
});


router.post('/', authenticateToken, async (req, res) =>  {
    try {
        const { gestiuneId, locationId, responsibleId, inventoryNumber, name, categoryId, cost } = req.body
        const createdById = req.user.id;
        if (!name || !inventoryNumber || !gestiuneId || !locationId || !responsibleId) {
        return res.status(400).json({ error: 'Missing required fields' });
        }
        const createItem = await prisma.item.create({
            data: { createdById,
            gestiuneId: gestiuneId,
            locationId,
            responsibleId,
            inventoryNumber,
            name,
            categoryId,
            cost
            }
        })
        res.status(201).send()
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
});


router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if(isNaN(id)) {
            return res.status(400).json ({ error: 'No ID found'});
        }
        const deleteItem = await prisma.item.delete({
            where: {
                id
            },
        });
        res.status(204).send()
    } catch (error) {
        if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Item not found' });
        }
        res.status(500).json({ error: error.message })
    }

})

router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

        const { name, description, status, cost, gestiuneId, locationId, responsibleId, categoryId, note } = req.body;

        const currentItem = await prisma.item.findUnique({ where: { id } });
        if (!currentItem) return res.status(404).json({ error: 'Item not found' });

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.status = status;
        if (cost !== undefined) updateData.cost = cost;
        if (gestiuneId !== undefined) updateData.gestiuneId = gestiuneId;
        if (locationId !== undefined) updateData.locationId = locationId;
        if (responsibleId !== undefined) updateData.responsibleId = responsibleId;
        if (categoryId !== undefined) updateData.categoryId = categoryId;

        // The relations the frontend table needs back
        const include = {
            gestiune: true,
            location: true,
            category: true,
            responsible: true,
            statusHistory: true
        };

        if (status && status !== currentItem.status) {
            const updatedItem = await prisma.$transaction(async (tx) => {
                await tx.statusHistory.create({
                    data: {
                        itemId: id,
                        status,
                        note: note || `Status updated from ${currentItem.status} to ${status}`
                    }
                });
                return tx.item.update({ where: { id }, data: updateData, include });
            });
            return res.json(updatedItem);
        }

        const updatedItem = await prisma.item.update({ where: { id }, data: updateData, include });
        res.json(updatedItem);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;