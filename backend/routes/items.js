const express = require('express');
const router = express.Router();
const prisma = require('../client')

// define the home page route
router.get('/', async (req, res) => {
  try {
    const items = await prisma.item.findMany({
        include: {
            department: true,
            location: true,
            category: true,
            responsible: true
        }
    })
    res.json(items)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
});

router.post('/', async (req, res) =>  {
    try {
        const { createdById, departmentId, locationId, responsibleId, inventoryNumber, name } = req.body
        const createItem = await prisma.item.create({
            data: { createdById,
            departmentId,
            locationId,
            responsibleId,
            inventoryNumber,
            name
            }
        })
        res.status(201).send()
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
});


router.delete('/:id', async (req, res) => {
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

module.exports = router;