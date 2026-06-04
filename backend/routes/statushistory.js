const express = require('express');
const router = express.Router();
const prisma = require('../client')

router.get('/', async (req, res) => {
    try {
        const statushistory = await prisma.statusHistory.findMany( {
            select: { status: true, itemId: true }
        })
        res.json(statushistory);
    } catch(error) {
        res.status(500).json({ error: error.message })
    }

});

module.exports = router;