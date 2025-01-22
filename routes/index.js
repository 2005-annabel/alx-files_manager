const express = require('express');
const UsersController = require('../controllers/UsersController');

const router = express.Router();

router.post('/users', UsersController.postNew);

module.exports = router;
