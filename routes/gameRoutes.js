const express = require('express');
const router = express.Router();
const { createBet } = require('../controllers/gameController');

router.post('/create', createBet);

module.exports = router;
