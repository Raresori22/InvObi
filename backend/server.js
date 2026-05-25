const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'InvObi API is running' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})