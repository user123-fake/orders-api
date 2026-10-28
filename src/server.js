const express = require('express');
const quoteRoutes = require('./routes/quote');
const orderRoutes = require('./routes/orders');
const reportRoutes = require('./routes/reports');
const { notFound, errorHandler } = require('./errors');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/quote', quoteRoutes);
app.use('/orders', orderRoutes);
app.use('/reports', reportRoutes);
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`orders-api listening on ${port}`));
