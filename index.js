const express = require('express'),
  morgan = require('morgan'),
  fs = require('fs'), // import built in node modules fs and path 
  path = require('path');
  uuid = require('uuid');
  bodyParser = require('body-parser');

const app = express();

// create a write stream (in append mode)
// a ‘log.txt’ file is created in root directory

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})
// use bodyParser

app.use(bodyParser.json());


// create an array for movie list endpoint and users
let users = [
  {
    id: 1,
    name: "Tim",
    favoriteMovies: []
  },
  {
    id: 2,
    name: "Bob",
    favoriteMovies: []
  },
]

let topMovies = [
  {
    'Title': 'Lord of the Rings: The Return of the King',
    'Director': {
      'Name': 'Peter Jackson',
    },
    'Genre': {
      'Name': 'Fantasy'
    },
  },
  {
    'Title': 'Apocalypto',
    'Director': {
      'Name': 'Mel Gibson',
    },
    'Genre': {
      'Name': 'Action'
    },
  },
  {
    'Title': 'Bone Tomahawk',
    'Director': {
      'Name': 'S Craig Zahler',
    },
    'Genre': {
      'Name': 'Western'
    },
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

app.use('/static', express.static('public'));



//Allow new users to register
app.post('/users', (req, res) => {
  const newUser = req.body;

  if (newUser.name) {
    newUser.id = uuid.v4();
    users.push(newUser);
    res.status(201).json(newUser)
  } else {
    res.status(400).send('users need names')
  }
})

//Update user ID 
app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const updatedUser = req.body;

  let user = users.find( user => user.id == id );

  if (user) {
    user.name = updatedUser.name;
    res.status(200).json(user);
  } else {
    res.status(400).send('user does not exist')
  }
})

//Allow users to add a movie to their list of favorites
app.post('/users/:id/:movieTitle', (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find( user => user.id == id );

  if (user) {
    user.favoriteMovies.push(movieTitle);
    res.status(200).send(`${movieTitle} has been added to user ${id}'s array`);
  } else {
    res.status(400).send('user does not exist')
  }
})

//Delete movie from a user's list
app.delete('/users/:id/:movieTitle', (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find( user => user.id == id );

  if (user) {
    user.favoriteMovies = user.favoriteMovies.filter( title => title !== movieTitle );
    res.status(200).send(`${movieTitle} has been removed from ${id}'s array`);
  } else {
    res.status(400).send('user does not exist')
  }
})

//Allow a user to de-register
app.delete('/users/:id', (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find( user => user.id == id );

  if (user) {
    users = users.filter( user => user.id != id );
    res.status(200).send(`${id}'s movie list has been deleted`);
  } else {
    res.status(400).send('user does not exist')
  }
})

//Get all movies
app.get('/movies', (req, res) => {
  res.status(200).json(topMovies)
})

//Get title of movie
app.get('/movies/:title', (req, res) => {
  const { title } = req.params;
  const movie = topMovies.find( movie => movie.Title === title );

  if (movie) {
    res.status(200).json(movie);
  } else {
    res.status(400).send('no such movie')
  }

})

//Get genre of movie
app.get('/movies/genre/:genreName', (req, res) => {
  const { genreName } = req.params;
  const genre = topMovies.find( movie => movie.Genre.Name === genreName ).Genre;

  if (genre) {
    res.status(200).json(genre);
  } else {
    res.status(400).send('no such genre')
  }

})

//Get director of movie
app.get('/movies/directors/:directorName', (req, res) => {
  const { directorName } = req.params;
  const director = topMovies.find( movie => movie.Director.Name === directorName ).Director;

  if (director) {
    res.status(200).json(director);
  } else {
    res.status(400).send('no such director')
  }

})

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});