const express = require('express');
const router = express.Router();
const searchController = require('../../../Controllers/User/Main Search/SearchController')
const jwtVerify=require('../../../Middlewares/jwtMiddleware')


router.get('/view',searchController.MainSearch)

module.exports = router;