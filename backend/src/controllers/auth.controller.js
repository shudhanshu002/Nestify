import User from "../models/user.model";
import generateToken from "../utils/generateToken";

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