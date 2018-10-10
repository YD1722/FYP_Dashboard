/** 
 * This is a simple express server, to show how to proxy weather rquest to DarkSky API.
 */
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cors = require('cors');
let mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/test');
let conn = mongoose.connection;
let multer = require('multer');
let GridFsStorage = require('multer-gridfs-storage');
let Grid = require('gridfs-stream');
Grid.mongo = mongoose.mongo;
let gfs = Grid(conn.db);
let port = 3001;
require('es6-promise').polyfill();
require('isomorphic-fetch');


// Configure app to use bodyParser to parse json data

var server = require('http').createServer(app);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Setting up the root route
app.get('/', (req, res) => {
  res.send('Welcome to the express server');
});

app.get('/file/:filename', (req, res) => {
  gfs.collection('fs'); //set collection name to lookup into

  /** First check if file exists */
  gfs.files.find({ filename: req.params.filename }).toArray(function (err, files) {
    if (!files || files.length === 0) {
      return res.status(404).json({
        responseCode: 1,
        responseMessage: "error"
      });
    }
    // create read stream
    var readstream = gfs.createReadStream({
      filename: files[0].filename,
      root: "fs"
    });
    // set the proper content type 
    res.set('Content-Type', files[0].contentType)
    // Return response
    return readstream.pipe(res);
  });
});


// Following is an example to proxy client request to DarkSky forecast API
var DARKSKY_SECRET_KEY = 'b03f37e6864d6c346701ce46fdd4550d'; // Please use your own darksky secret key. 
// Get one for free at https://darksky.net/dev/
// DarkSky returns 403 (forbidden) error for invalid key.

var url_prefix = 'https://api.darksky.net/forecast/' + DARKSKY_SECRET_KEY + '/';
app.get('/api/darksky', function (req, res) {
  try {
    // Retrieves location coordinates (latitude and longitude) from client request query
    var coordinates = req.query.latitude + ',' + req.query.longitude;
    var url = url_prefix + coordinates;
    console.log('Fetching ' + url);

    fetch(url)
      .then(function (response) {
        if (response.status != 200) {
          res.status(response.status).json({ 'message': 'Bad response from Dark Sky server' });
        }
        return response.json();
      })
      .then(function (payload) {
        res.status(200).json(payload);
      });
  } catch (err) {
    console.log("Errors occurs requesting Dark Sky API", err);
    res.status(500).json({ 'message': 'Errors occurs requesting Dark Sky API', 'details': err });
  }
});

// Start the server
server.listen(port);
console.log('Server is listening on port ' + port);
