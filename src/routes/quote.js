const express = require('express');
const { parseItems } = require('../validation');
const { priceItems } = require('../pricing/priceItems');

const router = express.Router();

router.post('/', (req, res) => {
  const items = parseItems(req.body);
  res.json(priceItems(items));
});

module.exports = router;
