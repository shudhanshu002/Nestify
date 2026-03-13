import User from "../models/user.model.js";


/*
    Services to handle User-related bussiness logic
*/

export const findUserByEmail = async(email) => {
    return await User.findOne({email});
}

export const createUser = async (userData) => {
  return await User.create(userData);
};

export const findUserById = async (id) => {
  return await User.findById(id).select('-password');
};

export const validateUserPassword = async (user, password) => {
  return await user.matchPassword(password);
};