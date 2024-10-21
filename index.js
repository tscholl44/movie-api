const express = require('express'),
  morgan = require('morgan'),
  fs = require('fs'), // import built in node modules fs and path 
  path = require('path');

const app = express();

// create a write stream (in append mode)
// a ‘log.txt’ file is created in root directory

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})

// create an array for movie list endpoint

let topMovies = [
  {
    title: 'Lord of the Rings: The Return of the King',
    director: 'Peter Jackson'
  },
  {
    title: 'Apocalypto',
    director: 'Mel Gibson'
  },
  {
    title: 'Bone Tomahawk',
    director: 'S. Craig Zahler'
  }
];

// setup the logger
app.use(morgan('combined', {stream: accessLogStream}));

app.get('/movies', (req, res) => {
  res.json(topMovies);
});

app.get('/', (req, res) => {
  res.send('Only the best movies!');
});

app.use('/documentation.html', express.static('public'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});