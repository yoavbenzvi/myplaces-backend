const { v4: uuid } = require('uuid');
const { validationResult } = require('express-validator');
const HttpError = require('../models/http-error');
const User = require('../models/user');

const DUMMY_USERS = [
	{
		id: 'u1',
		name: 'Jane Doe',
		email: 'test@test.com',
		password: 'test'
	}
]

const getUsers = (req, res, next) => {
	res.json({users: DUMMY_USERS})
}

const signup = async (req, res, next) => {
	const errors = validationResult(req);
	if(!errors.isEmpty()) {
		console.log(errors)
		return next(new HttpError('Invalid inputs passed, please check data', 422));
	}

	const { name, email, password, places } = req.body;

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
		//change dummy value
		places
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

	let userExists;
	try {
		userExists = await User.findOne({email})
	} catch(err) {
		const error = new HttpError('Logging in failed. Please check credentials or try again later', 500)
		return next(error);
	}

	// const identifiedUser = DUMMY_USERS.find(u => u.email === email);
	// if(!identifiedUser || identifiedUser.password !== password) {
	// 	throw new HttpError('Could not identify user, credentials might be wrong', 401);
	// }

	if(!userExists || userExists.password !== password) {
		const error = new HttpError('Invalid credentials. Please check credentials or try again later', 401)
		return next(error);
	}

	res.json({message: 'Logged in'})
}

exports.getUsers = getUsers
exports.signup = signup
exports.login = login