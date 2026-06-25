const express = require('express');
const router = express.Router();
const prisma = require('../client');
const authenticateToken = require('../authenticateToken');

router.get('/', authenticateToken, async (req, res) => {
    try { 
        const category = await prisma.category.findMany({
            select: { name: true, id: true }
        })
        res.json(category);
    } catch(error) {
        res.status(500).json({ error: error.message })
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID format' });

        const category = await prisma.category.findUnique({
            where: { id },
            select: { name: true, id: true }
        });

        if (!category) return res.status(404).json({ error: 'Category not found' });
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body
    const createCategory = await prisma.category.create ({
      data: {
        name
      }
    })
    res.status(201).send()
  } catch(error) {
    res.status(500).json({ error: error.message })
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if(isNaN(id)) {
      return res.status(400).json ({ error: 'No ID found '});
    }
    const deleteCategory = await prisma.category.delete({
      where: {
        id
      },
    });
    res.status(204).send()
  } catch (error) {
    if(error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if(isNaN(id)) {
      return res.status(400).json ({ error: 'No ID found'});
    }

    const { name } = req.body;

    const data = {};
    if(name) data.name = name;

    if(Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No fields provided to update'});
    }

    const category = await prisma.category.update({
      where: { id },
      data,
      select: { id: true, name: true }
    });
    res.json(category);
  } catch (error) {
    const pgCode = error.code || error.cause?.code;
    if (pgCode === 'P2003' || pgCode === '23503' || pgCode === '23001') {
        return res.status(409).json({ error: 'Cannot delete: still assigned to one or more items' });
    }
    if(error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found '});
    }
    res.status(500).json({ error: error.message })
  }
});

module.exports = router;