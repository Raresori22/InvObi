const express = require('express');
const router = express.Router();
const prisma = require('../client')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const authenticateToken = require('../authenticateToken');


router.use(express.json())

router.get('/', authenticateToken, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { email: true, username: true, id: true, role: true }
        })
        res.json(users)
    } catch(error) {
        res.status(500).json({ error: error.message })
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID format' });

        const user = await prisma.user.findUnique({
            where: { id },
            select: { email: true, username: true, id: true, role: true }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.post('/', async (req, res) => {
    try {
        const { email, password, username } = req.body;
        if (!email || !password || !username) {
        return res.status(400).json({ error: 'Email, password and username are required' });
        }
        const hashedPassword = await bcrypt.hash(password , 10)
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

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if(!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const user = await prisma.user.findUnique({
            where: { username },
        });

        if(!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const doPasswordsMatch = await bcrypt.compare(password, user.password);
        if(doPasswordsMatch) {
            const tokenPayload = {
                id: user.id,
                username: user.username,
                role: user.role
            };

            const accessToken = generateAccessToken(tokenPayload);
            const refreshToken = jwt.sign(tokenPayload, process.env.REFRESH_TOKEN_SECRET);

            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7)

            await prisma.refreshToken.create({
                data: {
                    token: refreshToken,
                    userId: user.id,
                    expiresAt
                }
            });

            res.json({
            message: 'Login succesful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
            accessToken,
            refreshToken
        });
        } else {
            res.status(401).json({ error: 'Invalid username or password'})
        }

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
});

function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m'})
}

router.post('/token', async (req, res) => {
    try {
        const { token: refreshToken } = req.body;
        if(!refreshToken) return res.sendStatus(401);

        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: refreshToken }
        });

        if(!storedToken) return res.sendStatus(403);

        if(storedToken.expiresAt < new Date()) {
            await prisma.refreshToken.delete({ where: { token: refreshToken } });
            return res.status(403).json({ error: 'Token expired, please login again'})
        }

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
            if (err) return res.sendStatus(403);

            const accessToken = generateAccessToken({
                id: user.id,
                username: user.username,
                role: user.role
            });
            res.json({ accessToken })
        })
    } catch(error) {
        res.status(500).json({ error: error.message });
    }
})

router.delete('/logout', async (req, res) => {
    try{
        const { token: refreshToken } = req.body;
        if(!refreshToken) return res.sendStatus(400);

        await prisma.refreshToken.delete({
            where: { token: refreshToken }
        });
        
        res.sendStatus(204);
    } catch(error) {
    if (error.code === 'P2025') return res.sendStatus(204);
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