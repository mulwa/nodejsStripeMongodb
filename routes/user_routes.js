const express = require('express');
var router = express.Router();
var userController = require('../controllers/user_controller');

router.post('/signup',userController.registerUser);
router.get('/users',userController.protectRoute ,userController.getAllUser);
router.post('/login',userController.login);
router.post('/forgotPassword',userController.forgotPassword);
router.patch('/resetPassword/:token',userController.resetPassword);
router.patch('/updateMyPassword',userController.protectRoute ,userController.updatePassword);

module.exports = router;