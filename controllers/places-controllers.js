const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const HttpError = require('../models/http-error'); 
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/user');

const getPlaceById = async (req, res, next) => {
	const placeId = req.params.pid;

	let place;
	try {
		//could turn this into a promise with exec()
		place = await Place.findById(placeId)
	} catch(err) {
		const error = new HttpError('Something went wrong. Could not find place', 500);
		return next(error);
	}

	if(!place) {
		const error = new HttpError('Could not find place for the provided id', 404);
		return next(error);
	}
	//Two things happen in the response:
	//1. Turning the Mongoose object back to a JS object with a Mongoose method
	//2. Setting getters to true in order to get an id property
	res.json({place: place.toObject({ getters: true })})
}

const getPlacesByUserId = async (req, res, next) => {
	const userId = req.params.uid;

	let places;
	try {
		// Using the find method (of Mongoose) in order to get places of given user
		places = await Place.find({ creator: userId });
	} catch(err) {
		const error = new HttpError('Fetching places failed. Please try again', 404)
		return next(error);
	}

	if(!places || places.length === 0) {
		return next(new HttpError('Could not find places for the provided user id', 404));
	}

	res.json({places: places.map(place => place.toObject({ getters: true }))})
}

//Alternative method with populate
// const getPlacesByUserId = async (req, res, next) => {
// 	const userId = req.params.uid;

// 	let userWithPlaces;
// 	try {
// 		userWithPlaces = await User.findById(userId).populate('places')
// 	} catch(err) {
// 		const error = new HttpError('Fetching places failed. Please try again', 404)
// 		return next(error);
// 	}

// 	if(!userWithPlaces || userWithPlaces.places.length === 0) {
// 		return next(new HttpError('Could not find places for the provided user id', 404));
// 	}

// 	res.json({places: userWithPlaces.places.map(place => place.toObject({ getters: true }))})
// }

const createPlace = async (req, res, next) => {
	const errors = validationResult(req);
	if(!errors.isEmpty()) {
		return next(new HttpError('Invalid inputs passed, please check data', 422));
	}

	const { title, description, address, creator } = req.body;

	let coordinates;
	try {
		coordinates = await getCoordsForAddress(address);
	} catch(error) {
		return next(error)
	}

	const createdPlace = new Place({
		title,
		description,
		address,
		location: coordinates,
		//DUMMY IMAGE - to change!
		image: 'https://p.bigstockphoto.com/GeFvQkBbSLaMdpKXF1Zv_bigstock-Aerial-View-Of-Blue-Lakes-And--227291596.jpg',
		creator
	});

	let user;
	try {
		user = await User.findById(creator);
	} catch(err) {
		const error = new HttpError('Creating place failed, please try again', 500);
		return next(error);
	}

	if(!user) {
		const error = new HttpError('Could not find user for provided id', 404);
		return next(error);
	}

	try {
		const session = await mongoose.startSession();
		session.startTransaction();
		await createdPlace.save({ session });
		user.places.push(createdPlace);
		await user.save({ session });
		await session.commitTransaction();
	} catch(err) {
		const error = new HttpError('Creating place failed, please try again', 500);
		return next(error);
	}

	res.status(201).json({place: createdPlace});
}

const updatePlaceById = async (req, res, next) => {
	const errors = validationResult(req);
	if(!errors.isEmpty()) {
		return next(new HttpError('Invalid inputs passed, please check data', 422));
	}

	const { title, description } = req.body;
	const placeId = req.params.pid;

	let place;
	try {
		place = await Place.findById(placeId);
	} catch(err) {
		const error = new HttpError('Something went wrong. Could not update place', 500);
		return next(error);
	}
	
	place.title = title;
	place.description = description;

	try {
		await place.save();
	} catch(err) {
		const error = new HttpError('Something went wrong. Could not update place', 500);
		return next(error);
	}

	res.json({place: place.toObject({ getters: true })})
}

const deletePlace = async (req, res, next) => {
	const placeId = req.params.pid;

	let place;
	try {
		place = await Place.findById(placeId).populate('creator');
	} catch(err) {
		const error = new HttpError('Something went wrong. Could not delete place', 500);
		return next(error);
	}

	if(!place) {
		const error = new HttpError('Could not find place for this id', 404);
		return next(error);
	}

	try {
		const session = await mongoose.startSession();
		session.startTransaction();
		await place.remove({ session });
		place.creator.places.pull(place);
		await place.creator.save({ session });
		await session.commitTransaction();
	} catch(err) {
		const error = new HttpError('Something went wrong. Could not delete place', 500);
		return next(error);
	}

	res.json({message: 'Deleted place'});
}

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlace = deletePlace;