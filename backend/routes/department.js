const express = require('express');
const router = express.Router();
const prisma = require('../client');
const authenticateToken = require('../authenticateToken');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const department = await prisma.department.findMany({
        select: { name: true, id: true }
    })
    res.json(department)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID format' });

        const department = await prisma.department.findUnique({
            where: { id },
            select: { name: true, id: true }
        });

        if (!department) return res.status(404).json({ error: 'Department not found' });
        res.json(department);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body
    const createDepartment = await prisma.department.create ({
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
    const deleteDepartment = await prisma.department.delete({
      where: {
        id
      },
    });
    res.status(204).send()
  } catch (error) {
    if(error.code === 'P2025') {
      return res.status(404).json({ error: 'Department not found' });
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

    const department = await prisma.department.update({
      where: { id },
      data,
      select: { id: true, name: true }
    });
    res.json(department);
  } catch (error) {
    if(error.code === 'P2025') {
      return res.status(404).json({ error: 'Department not found '});
    }
    res.status(500).json({ error: error.message })
  }
});

module.exports = router;