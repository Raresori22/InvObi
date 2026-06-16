const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3000
const items = require('./routes/items');
const department = require('./routes/department');
const category = require('./routes/category');
const statusHistory = require('./routes/statushistory');
const user = require('./routes/user');
const location = require('./routes/location');
const responsiblePerson = require('./routes/responsibleperson');

app.use(cors())
app.use(express.json())
app.use('/items', items);
app.use('/department', department);
app.use('/category', category);
app.use('/statushistory', statusHistory);
app.use('/user', user);
app.use('/location', location);
app.use('/responsibleperson', responsiblePerson);

app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'InvObi API is running',
    version: '1.0.0'
  })
})

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
