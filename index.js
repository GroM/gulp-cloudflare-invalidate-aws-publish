const PluginError = require('plugin-error')
	, log = require('fancy-log')
	, through = require('through2'),
	fetch = require('node-fetch');;
	// , aws = require('aws-sdk');

module.exports = function (options) {
	// options.wait = !!options.wait;
	options.indexRootPath = !!options.indexRootPath;

	// var cloudfront = new aws.CloudFront();

	var _c = {
		NAME: 'gulp-cloudflare-invalidate-aws-publish',
		endpoint: 'https://api.cloudflare.com/client/v4/',
		zone: options.zone || process.env.CF_ZONE,
		email: options.email || process.env.CF_EMAIL,
		key: options.key || process.env.CF_KEY,
		token: options.token || process.env.CF_TOKEN,
		states: { update: true, create: true },
		urlPrefix: '/',
		originPathRegex: false,
		indexRootPath: false
	};
	if(options.states)
	{
		for (let i = options.states.length - 1; i >= 0; i--) {
			_c.states[options.states[i]] = true;
		}
	}
	if(options.urlPrefix)
	{
		//TODO add validation
		_c.urlPrefix = options.urlPrefix;
	}
	if(options.endpoint)
	{
		_c.endpoint = options.endpoint;
	}
	if(options.originPath)
	{
		_c.originPathRegex = new RegExp(options.originPath.replace(/^\//, '') + '\/?');
	}
	if(options.indexRootPath)
	{
		_c.indexRootPath = /index\.html$/;
	}

	var files = [];

	var complain = function (err, msg, callback) {
		callback(false);
		throw new PluginError(_c.NAME, msg + ': ' + err);
	};

	//TODO check if CF supports
	var check = function (id, callback) {
		return callback; //block for now
		cloudfront.getInvalidation({
			DistributionId: options.distribution,
			Id: id
		}, function (err, res) {
			if (err) return complain(err, 'Could not check on invalidation', callback);

			if (res.Invalidation.Status === 'Completed') {
				return callback();
			} else {
				setTimeout(function () {
					check(id, callback);
				}, 1000);
			}
		})
	};

	var processFile = function (file, encoding, callback)
	{
		// https://github.com/pgherveou/gulp-awspublish/blob/master/lib/log-reporter.js
		// var state;

		if (!file.s3 || !file.s3.state) return callback(null, file);

		// if (options.states && options.states.indexOf(file.s3.state) === -1) return callback(null, file);

		switch (file.s3.state)
		{
			case 'update':
			case 'create':
			case 'delete':
				let path = file.s3.path;

				if (_c.originPathRegex)
				{

					path = path.replace(_c.originPathRegex, '');
				}

				files.push(path);
				if (_c.indexRootPath && c.indexRootPath.test(path))
				{
					files.push(path.replace(_c.indexRootPath, ''));
				}
				break;
			case 'cache':
			case 'skip':
				break;
			default:
				log('Unknown state: ' + file.s3.state + ' for ' + file.s3.path);
				break;
		}

		return callback(null, file);
	};

	var invalidate = function(callback)
	{
		if(files.length == 0) return callback();

		// files = files.map(function(file)
		// {
		// 	return '/' + file;
		// });
		/*
Requests
Requests must be sent over HTTPS with any payload formatted in JSON. Depending on if a request is authenticated with the new API Tokens or the old API Keys, required headers differ and are detailed below.

API Tokens
API Tokens provide a new way to authenticate with the Cloudflare API. They allow for scoped and permissioned access to resources and use the RFC compliant Authorization Bearer Token Header.
Required parameters
Name	Format	Description
API Token	Authorization: Bearer <token>	API Token generated from the User Profile 'API Tokens' page
Example request
Requests are generally formatted as follows:

GET object/:object_id
API Token cURL (example)
curl -X GET "https://api.cloudflare.com/client/v4/zones/cd7d0123e3012345da9420df9514dad0" \
     -H "Content-Type:application/json" \
     -H "Authorization: Bearer YQSn-xWAQiiEh9qM58wZNnyQS7FUdoqGIUAbrh7T"
API Keys
All requests must include both X-AUTH-KEY and X-AUTH_EMAIL headers to authenticate. Requests that use X-AUTH-USER-SERVICE-KEY  can use that instead of the Auth-Key and Auth-Email headers.
Required parameters
Name	Format	Description
API Key	X-Auth-Key	API key generated on the "My Account" page
Email	X-Auth-Email	Email address associated with your account
User Service Key	X-Auth-User-Service-Key	A special Cloudflare API key good for a restricted set of endpoints. Always begins with "v1.0-", may vary in length.
Example request
Requests are generally formatted as follows:

GET object/:object_id
Auth-Email cURL (example)
curl -X GET "https://api.cloudflare.com/client/v4/zones/cd7d0123e3012345da9420df9514dad0" \
     -H "Content-Type:application/json" \
     -H "X-Auth-Key:1234567893feefc5f0q5000bfo0c38d90bbeb" \
     -H "X-Auth-Email:example@example.com"
User-Service cURL (example)
curl -X GET "https://api.cloudflare.com/client/v4/zones/cd7d0123e3012345da9420df9514dad0" \
     -H "Content-Type:application/json" \
     -H "X-Auth-User-Service-Key:v1.0-e24fd090c02efcfecb4de8f4ff246fd5c75b48946fdf0ce26c59f91d0d90797b-cfa33fe60e8e34073c149323454383fc9005d25c9b4c502c2f063457ef65322eade065975001a0b4b4c591c5e1bd36a6e8f7e2d4fa8a9ec01c64c041e99530c2-07b9efe0acd78c82c8d9c690aacb8656d81c369246d7f996a205fe3c18e9254a"`




Url:
POST zones/:identifier/purge_cache

Api files param
[
  "http://www.example.com/css/styles.css",
  {
    "url": "http://www.example.com/cat_picture.jpg",
    "headers": {
      "Origin": "cloudflare.com",
      "CF-IPCountry": "US",
      "CF-Device-Type": "desktop"
    }
  }
]

Curl example:
curl -X POST "https://api.cloudflare.com/client/v4/zones/023e105f4ecef8ad9ca31a8372d0c353/purge_cache" \
     -H "X-Auth-Email: user@example.com" \
     -H "X-Auth-Key: c2547eb745079dac9320b638f5e225cf483cc5cfdda41" \
     -H "Content-Type: application/json" \
     --data '{"files":["http://www.example.com/css/styles.css",{"url":"http://www.example.com/cat_picture.jpg","headers":{"Origin":"cloudflare.com","CF-IPCountry":"US","CF-Device-Type":"desktop"}}]}'

Response:
		*/
		let d = {
			files: files.map((f) => { return _c.urlPrefix + f })
		}
		let h = {
			'Content-Type': 'application/json'
		}
		if(_c.token)
		{
			h.Authorization = "Bearer " + _c.token;
		}
		else
		{
			h['X-Auth-Key'] = _c.key;
			h['X-Auth-Email'] = _c.email;
		}
		fetch(_c.endpoint, {
			method: 'POST',
			headers: h,
			body: JSON.stringify(d),
		})
			.then(res => res.json())
			.then(json => console.log(json))

		/*
		cloudfront.createInvalidation({
			DistributionId: options.distribution,
			InvalidationBatch: {
				CallerReference: Date.now().toString(),
				Paths: {
					Quantity: files.length,
					Items: files
				}
			}
		}, function (err, res) {
			if (err) return complain(err, 'Could not invalidate CloudFlare', callback);

			log('CloudFlare invalidation created: ' + res.Invalidation.Id);

			if (!options.wait)
			{
				return callback();
			}

			check(res.Invalidation.Id, callback);
		});
		*/
	};

	return through.obj(processFile, invalidate);
};
