const express = require('express');
const userRoutes = require('./routes/route');
const db = require('./config/db');

const app = express();
app.use(express.json());

// Use routes
app.use('/api', userRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
