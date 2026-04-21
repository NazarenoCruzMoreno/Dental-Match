<<<<<<< HEAD
const userModel = require('../models/user.model');

exports.getAllUsers = async () => {
  return await userModel.getUsers();
};

exports.createUser = async (data) => {
  return await userModel.createUser(data);
=======
const userModel = require('../models/user.model');

exports.getAllUsers = async () => {
  return await userModel.getUsers();
};

exports.createUser = async (data) => {
  return await userModel.createUser(data);
>>>>>>> main
};