const express = require('express');
const router = express.Router();
const prisma = require('../client')

router.get('/', async (req, res) => {
    try {
        const responsiblePerson = await prisma.responsiblePerson.findMany({
            select: { name: true }
        })
        res.json(responsiblePerson);
    } catch(error) {
        res.status(500).json({ error: error.message })
    }
});

module.exports = router;