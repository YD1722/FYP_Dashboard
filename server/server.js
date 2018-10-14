
var express = require('express');
var DarkSky = require('dark-sky')
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
let api_keys = ['b03f37e6864d6c346701ce46fdd4550d',
  '0c26bd35772366ab9b8e15fe4a121c1c',
  '77418266a86e6c68c8fcdf2b12ea1856',
  '09258809c8a908bbf00d4a16a4a7a81c',
  'f9ef9e89c22946cd6248855ed4f452f8',
  '0112c9f14f60b7b881d68e5dfd489485',
  '22f0399662fb3b4ac1c6a08b46fcc7b5',
  'b78b6e3c3d3aa12394bea764a28be97d',
  'a0ba129df835c5bafdddda535211b944',
  '2c92133d99c330bc16a00aab5b688ce5',
  '62e3c0802e57945aff5078472367a33c',
  'bfe39dc601d2c3fe5ce3bd172bb195d8',
  '234c71f721b0e84ded96906c645509cf',
  '41ae8bee39d644014b342e5232349046',
  '8eab7a876af2f55cd5b2a9921b79e4a1',
]
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

const darksky = new DarkSky(api_keys[2])

app.use('/weather', async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body
    const forecast = await darksky
      .options({
        latitude,
        longitude,
        // time: moment().subtract(1, 'weeks')
      })
      .get()
    res.status(200).json(forecast)
  } catch (err) {
    next(err)
  }
})

// Start the server
server.listen(port);
console.log('Server is listening on port ' + port);
