const { validationResult } = require('express-validator');
const HttpError = require('../models/http-error');
const User = require('../models/user');

const getUsers = async (req, res, next) => {
	let users;
	try {
		users = await User.find({}, '-password')
	} catch(err) {
		const error = new HttpError('Fetching users failed', 500)
		return next(error);
	}

	res.json({users: users.map(user => user.toObject({ getters: true }))})
}

const signup = async (req, res, next) => {
	const errors = validationResult(req);
	if(!errors.isEmpty()) {
		console.log(errors)
		return next(new HttpError('Invalid inputs passed, please check data', 422));
	}

	const { name, email, password } = req.body;

	let userExists;
	try {
		userExists = await User.findOne({email})
	} catch(err) {
		const error = new HttpError('Signup failed. Please try again later', 500)
		return next(error);
	}

	if(userExists) {
		const error = new HttpError('Signup failed. Email already in use, please log in', 422)
		return next(error);
	}

	const createdUser = new User({
		name,
		email,
		//change dummy image
		image: 'https://img.favpng.com/7/5/8/computer-icons-font-awesome-user-font-png-favpng-YMnbqNubA7zBmfa13MK8WdWs8.jpg',
		password,
		places: []
	});

	try {
		await createdUser.save()
	} catch(err) {
		const error = new HttpError('Sign up failed, please try again later', 500);
		return next(error);
	}

	res.status(201).json({user: createdUser.toObject({ getters: true })});
}

const login = async (req, res, next) => {
	const { email, password } = req.body;

	let existingUser;
	try {
		existingUser = await User.findOne({email})
	} catch(err) {
		const error = new HttpError('Logging in failed. Please check credentials or try again later', 500)
		return next(error);
	}

	if(!existingUser || existingUser.password !== password) {
		const error = new HttpError('Invalid credentials. Please check credentials or try again later', 401)
		return next(error);
	}

	res.json({
		message: 'Logged in', 
		user: existingUser.toObject({ getters: true })
	})
}

exports.getUsers = getUsers
exports.signup = signup
exports.login = login