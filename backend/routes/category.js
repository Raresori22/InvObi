const express = require('express');
const router = express.Router();
const prisma = require('../client')

router.get('/', async (req, res) => {
    try { 
        const category = await prisma.category.findMany({
            select: { name: true }
        })
        res.json(category);
    } catch(error) {
        res.status(500).json({ error: error.message })
    }
});

router.post('/', async (req, res) => {
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

router.delete('/:id', async (req, res) => {
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

module.exports = router;