const express = require('express');
const router = express.Router();
const prisma = require('../client')

router.get('/', async (req, res) => {
    try {
        const location = await prisma.location.findMany({
            select: { name: true }
        })
        res.json(location);
    } catch(error) {
        res.status(500).json({ error: error.message })
    }
});

router.post('/', async (req, res) => {
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

router.delete('/:id', async (req, res) => {
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
    if(error.code === 'P2025') {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.status(500).json({ error: error.message })
  }
})


module.exports = router;