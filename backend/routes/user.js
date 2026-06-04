const express = require('express');
const router = express.Router();
const prisma = require('../client')
const bcrypt = require('bcrypt')


router.get('/', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { email: true, username: true }
        })
        res.json(users)
    } catch(error) {
        res.status(500).json({ error: error.message })
    }
});

router.post('/', async (req, res) => {
    try {
        const { email, password, username } = req.body;
        const salt = await bcrypt.genSalt()
        const hashedPassword = await bcrypt.hash(password , salt)
        const users = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                username
            }
        })
     res.status(201).send()
    } catch(error) {
        res.status(500).json({ error: error.message })
    }
});

router.put('/:id', async (req, res) => {
    try{
        const id = parseInt(req.params.id);
        if(isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID' });
        }

        const { email, username, password } = req.body;

        const data = {};
        if(email) data.email = email;
                if (username) data.username = username;
        if (password) {
            const salt = await bcrypt.genSalt();
            data.password = await bcrypt.hash(password, salt);
        }

        if (Object.keys(data).length === 0) {
            return res.status(400).json({ error: 'No fields provided to update' });
        }

        const user = await prisma.user.update({
            where: { id },
            data,
            select: { id: true, email: true, username: true, role: true }
        });

        res.json(user);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;