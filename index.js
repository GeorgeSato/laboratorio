const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

//const client = redis.createClient(REDIS_PORT);
const client = redis.createClient({
   port :6379,
   host : '127.0.0.1',
   password : process.env.REDIS_PASSWORD
}



const app = express();

// Response
function setResponse(username, followers) {
	return `<h2>${username} has ${followers} Github followers</h2>`;
}

// Make request to Github
async function getRepos(req, res, next) {
	try {
		console.log('Fetching Repos...');

		const response = await fetch(
			`https://api.github.com/users/${req.params.username}`
		);
		const data = await response.json();

		const followers = data.followers;

		// Sets username as key and followers as value - Show in redis-cli
		client.setex(req.params.username, 3600, followers);

		res.send(setResponse(req.params.username, followers));
	} catch (err) {
		console.error(err);
		res.status(500);
	}
}

// Cache middleware
function cache(req, res, next) {
	const username = req.params.username;
	client.get(username, (err, data) => {
		if (err) throw err;

		if (data != null) {
			res.send(setResponse(username, data));
		} else {
			next();
		}
	});
}

app.get('/repos/:username', cache, getRepos);

app.listen(5000, () => console.log(`Server running on port ${PORT}`));
