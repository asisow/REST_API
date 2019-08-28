const express = require('express');
const { body } = require('express-validator/check')

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.put('/signup', [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .custom((value, { req }) => {
            return User.findOne({ email: value })
                .then(userDoc => {
                    if (userDoc) {
                        return Promise.reject('E-mail address already exists');
                    }
                })
        })
        .normalizeEmail(),
    body('name')
        .trim()
        .isLength({ min: 5 }),
    body('password')
        .trim()
        .not()
        .isEmpty()
        .withMessage("Password can't be an empty string")
    ],
    authController.signup
);

router.post('/login', [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('password')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Please enter a password')
    ],
    authController.login)

module.exports = router;