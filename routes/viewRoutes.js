const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.isLoggedIn);
router.get('/', viewsController.getOverview);

router.get('/tours/:slug', authController.protect, viewsController.getTour);

router.get('/login', viewsController.getLoginForm);
router.get('/me', authController.protect, viewsController.getAccount);
//router.get('/signup', viewsController.getSignupForm);

module.exports = router;
