const express = require('express');
const router = express.Router();
const controller = require('./controller');


router.get('/register',controller.registerUser);


module.exports = router;
