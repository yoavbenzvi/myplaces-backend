const express = require('express');
const app = express();

const placesRoutes = require('./routes/places-routes') ;

app.use('/api/places', placesRoutes);

app.use((error, req, res, next) => {
	if(res.headerSent) {
		return next(error);
	}
	res.status(error.code || 500).json({message: error.message || 'An unknown error occured'})
})

app.listen(5000, () => {
	'app is running on port 5000'
})