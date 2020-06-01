const express = require('express');
const app = express();

const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

app.use(express.json());

app.use('/api/places', placesRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res, next) => {
	const error = new HttpError('Could not find this route', 404)
	throw error;
})

//Error Handling
app.use((error, req, res, next) => {
	if(res.headerSent) {
		return next(error);
	}
	res.status(error.code || 500).json({message: error.message || 'An unknown error occured'})
})

app.listen(5000, () => {
	'app is running on port 5000'
})