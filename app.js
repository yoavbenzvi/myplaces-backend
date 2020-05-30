const express = require('express');
const app = express();

const placesRoutes = require('./routes/places-routes') ;

app.use('/api/places', placesRoutes);

app.listen(5000, () => {
	'app is running on port 5000'
})