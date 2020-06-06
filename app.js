const express = require('express');
const mongoose = require('mongoose');
const app = express();

const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

app.use(express.json());
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
	next();
})

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
//

mongoose.set('useCreateIndex', true)
mongoose.connect('mongodb+srv://yoav:2xOeNxAGCzOY8bh5@cluster0-akskb.mongodb.net/MERN?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() => {
		app.listen(5000, () => {
			console.log('app is running on port 5000')
		})	
	})
	.catch(err => console.log('Could not connect to database (Check IP address), \n', err))