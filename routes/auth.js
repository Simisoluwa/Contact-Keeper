const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const auth = require('../middleware/is-auth');

const User = require('../models/User');


//@route  GET api/auth
//@desc   Get logged in user
//@access Private
router.get('/', [auth], async (req,res) => {
   try {
       const user = await User.findById(req.user.id).select('-password');
       res.json(user)
   } catch (err) {
       console.error(err.message);
       res.status(500).send('Server Error');
   }
});



//@route  POST api/users
//@desc   Authenticate or Login user & get token
//@access Public
router.post('/', [
    check('email', 'Please include a valid email').not().isEmpty(),
    check('password', 'Password is required').exists()
], async (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        //If user does not exist
        if(!user){
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        //if password does not match
        if(!isMatch){
            return res.status(400).json({ msg: 'Invalid Credentials '});
        }
        //If successful create a token for the logged in user
        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(payload, config.get('jwtsecret'), {
            expiresIn: 360000
        }, (err, token) => {
            if(err) throw err;
            res.json({ token });
        })
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;