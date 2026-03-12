import User from "../models/user.model";
import generateToken from "../utils/generateToken";
import * as userService from '../services/user.service.js';

export const registerUser = async(req, res, next) => {
    try {
        const { firstName, lastName, email, password, role } = req.body;

        const userExists = await User.findOne({email});
        if(userExists) {
            res.status(400);
            throw new Error('User already exists');
        }

        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            role: role || 'TENANT'
        });

        if(user) {
            res.status(201).json({
            _id: user._id,
            firstName: user.firstName,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
            });
        }
    } catch (error) {
        next(error);
    }
}

// @desc Auth user & get token
// @route POST /api/v1/auth/login
export const loginUser = async(req, res, next) => {
    try {
        const {email, password} = req.body;

        const user = await userService.findUserByEmail(email);

        if(user && (await userService.validateUserPassword(user, password))) {
            res.json({
            _id: user._id,
            firstName: user.firstName,
            role: user.role,
            token: generateToken(user._id),
            });
        } else {
            res.status(401);
            throw new Error('Invalid email or password')
        }
    } catch (error) {
        next(error);
    }
};