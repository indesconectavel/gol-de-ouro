const express = require('express');
const router = express.Router();
const { createBet } = require('../controllers/betController');

router.post('/create', createBet);

module.exports = router;
