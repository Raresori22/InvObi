const express = require('express');
const router = express.Router();
const prisma = require('../client');
const authenticateToken = require('../authenticateToken');
const authorizeAdmin = require('../authorizeAdmin');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const gestiune = await prisma.gestiune.findMany({
        select: { name: true, id: true }
    })
    res.json(gestiune)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID format' });

        const gestiune = await prisma.gestiune.findUnique({
            where: { id },
            select: { name: true, id: true }
        });

        if (!gestiune) return res.status(404).json({ error: 'Gestiune not found' });
        res.json(gestiune);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.post('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { name } = req.body
    const createGestiune = await prisma.gestiune.create ({
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
    const deleteGestiune = await prisma.gestiune.delete({
      where: {
        id
      },
    });
    res.status(204).send()
  } catch (error) {
    if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Gestiune not found' });
    }

    const pgCode = error.code || error.cause?.code;
    if (pgCode === 'P2003' || pgCode === '23503' || pgCode === '23001') {
        return res.status(409).json({ error: 'Cannot delete: still assigned to one or more items' });
    }

    res.status(500).json({ error: error.message });
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

    const gestiune = await prisma.gestiune.update({
      where: { id },
      data,
      select: { id: true, name: true }
    });
    res.json(gestiune);
  } catch (error) {
    if(error.code === 'P2025') {
      return res.status(404).json({ error: 'Gestiune not found '});
    }
    res.status(500).json({ error: error.message })
  }
});

module.exports = router;