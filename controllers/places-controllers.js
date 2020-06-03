const { v4: uuid } = require('uuid');
const { validationResult } = require('express-validator');
const HttpError = require('../models/http-error'); 
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');

let DUMMY_PLACES = [
	{
		id: 'p1',
		title: 'Empire state building',
		description: 'a famous skyscraper',
		location: {
			lat: 40.7484474,
			lng: -73.9871516
		},
		address: '20 W 34th St. New York, NY 10001',
		creator: 'u1'
	}
];

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

	try {
		await createdPlace.save()
	} catch(err) {
		const error = new HttpError('Creating place failed, please try again', 500);
		return next(error);
	}

	res.status(201).json({place: createdPlace});
}

const updatePlaceById = (req, res, next) => {
	const errors = validationResult(req);
	if(!errors.isEmpty()) {
		console.log(errors)
		throw new HttpError('Invalid inputs passed, please check data', 422)
	}

	const { title, description } = req.body;
	const placeId = req.params.pid;

	const updatedPlace = {...DUMMY_PLACES.find(p => p.id === placeId)};
	const placeIndex = DUMMY_PLACES.findIndex(p => p.id === placeId);
	updatedPlace.title = title;
	updatedPlace.description = description;

	DUMMY_PLACES[placeIndex] = updatedPlace;

	res.json({place: updatedPlace})
}

const deletePlace = (req, res, neaxt) => {
	const placeId = req.params.pid;
	if(!DUMMY_PLACES.find(p => p.id === placeId)) {
		throw new HttpError('Could not find place for that id', 404)
	}
	DUMMY_PLACES = DUMMY_PLACES.filter(p => p.id !== placeId);
	res.json({message: 'Deleted place'});
}

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlace = deletePlace;