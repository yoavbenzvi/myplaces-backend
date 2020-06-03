const { v4: uuid } = require('uuid');
const { validationResult } = require('express-validator');
const HttpError = require('../models/http-error');

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

const signup = (req, res, next) => {
	const errors = validationResult(req);
	if(!errors.isEmpty()) {
		console.log(errors)
		throw new HttpError('Invalid inputs passed, please check data', 422)
	}

	const { name, email, password } = req.body;

	const userExists = DUMMY_USERS.find(u => u.email === email);
	if(userExists) {
		throw new HttpError('Could not create user, email already exits', 422)
	}

	const createdUser = {
		id: uuid(),
		name,
		email,
		password
	}

	DUMMY_USERS.push(createdUser);

	res.status(201).json({user: createdUser})
}

const login = (req, res, next) => {
	const { email, password } = req.body;

	const identifiedUser = DUMMY_USERS.find(u => u.email === email);
	if(!identifiedUser || identifiedUser.password !== password) {
		throw new HttpError('Could not identify user, credentials might be wrong', 401);
	}

	res.json({message: 'Logged in'})
}

exports.getUsers = getUsers
exports.signup = signup
exports.login = login