const express = require('express');
const router = express.Router();
const prisma = require('../client');
const authenticateToken = require('../authenticateToken');
const authorizeAdmin = require('../authorizeAdmin');

router.get('/', authenticateToken, async (req, res) => {
    try {
        const location = await prisma.location.findMany({
            select: { name: true, id: true }
        })
        res.json(location);
    } catch(error) {
        res.status(500).json({ error: error.message })
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID format' });

        const location = await prisma.location.findUnique({
            where: { id },
            select: { name: true, id: true }
        });

        if (!location) return res.status(404).json({ error: 'Location not found' });
        res.json(location);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { name } = req.body
    const createLocation = await prisma.location.create ({
      data: {
        name
      }
    })
    res.status(201).send()
  } catch(error) {
    res.status(500).json({ error: error.message })
  }
});

router.delete('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if(isNaN(id)) {
      return res.status(400).json ({ error: 'No ID found '});
    }
    const deleteLocation = await prisma.location.delete({
      where: {
        id
      },
    });
    res.status(204).send()
  } catch (error) {
    const pgCode = error.code || error.cause?.code;
    if (pgCode === 'P2003' || pgCode === '23503' || pgCode === '23001') {
        return res.status(409).json({ error: 'Cannot delete: still assigned to one or more items' });
    }
    if(error.code === 'P2025') {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
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

    const location = await prisma.location.update({
      where: { id },
      data,
      select: { id: true, name: true }
    });
    res.json(location);
  } catch (error) {
    if(error.code === 'P2025') {
      return res.status(404).json({ error: 'Location not found '});
    }
    res.status(500).json({ error: error.message })
  }
});

module.exports = router;