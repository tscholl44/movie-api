const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect('mongodb://localhost:27017/tomsFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });

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

// import auth.js file
let auth = require('./auth')(app);

// require passport module and import passport.js file
const passport = require('passport');
require('./passport');

// setup the logger
app.use(morgan('combined', {stream: accessLogStream}));

app.get('/', (req, res) => {
  res.send('Only the best movies!');
});

app.use('/static', express.static('public'));

// Get all users
app.get('/users', passport.authenticate('jwt', {session: false}), async (req, res) => {
  await Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//Allow new users to register
app.post('/users', async (req, res) => {
  await Users.findOne({ name: req.body.name })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.name + 'already exists');
      } else {
        Users
          .create({
            name: req.body.name,
            password: req.body.password,
            email: req.body.email,
            birthday: req.body.birthday,
            favoriteMovies: req.body.favoriteMovies
          })
          .then((user) =>{res.status(201).json(user) })
        .catch((error) => {
          console.error(error);
          res.status(500).send('Error: ' + error);
        })
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

//Update user by name 
app.put('/users/:name', passport.authenticate('jwt', {session: false}), async (req, res) => {
    // CONDITION TO CHECK ADDED HERE
    if(req.user.name !== req.params.name){
      return res.status(400).send('Permission denied');
    }
    // CONDITION ENDS
  await Users.findOneAndUpdate({ name: req.params.name }, { $set:
    {
      name: req.body.name,
      password: req.body.password,
      email: req.body.email,
      birthday: req.body.birthday,
      favoriteMovies: req.body.favoriteMovies
    }
  },
  { new: true }) // This line makes sure that the updated document is returned
  .then((updatedUser) => {
    res.json(updatedUser);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send("Error: " + err);
  })

});

//Allow users to add a movie to their list of favorites
app.post('/users/:name/favoriteMovies/:_id', passport.authenticate('jwt', {session: false}), async (req, res) => {
  await Users.findOneAndUpdate({ name: req.params.name }, {
     $push: { favoriteMovies: req.params._id }
   },
   { new: true }) // This line makes sure that the updated document is returned
  .then((updatedUser) => {
    res.json(updatedUser);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send("Error: " + err);
  });
});

//Delete movie from a user's list
app.delete('/users/:name/favoriteMovies/:_id', passport.authenticate('jwt', {session: false}), async (req, res) => {
  await Users.findOneAndUpdate({ name: req.params.name }, {
     $pull: { favoriteMovies: req.params._id }
   },
   { new: true }) // This line makes sure that the updated document is returned
  .then((updatedUser) => {
    res.json(updatedUser);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send("Error: " + err);
  });
});

// Delete a user by name
app.delete('/users/:name', passport.authenticate('jwt', {session: false}), async (req, res) => {
  await Users.findOneAndDelete({ name: req.params.name })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.name + ' was not found');
      } else {
        res.status(200).send(req.params.name + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//Get all movies
app.get('/movies', passport.authenticate('jwt', {session: false}), async (req, res) => {
  Movies.find()
    .then((movies) => {
      res.status(201).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

//Get title of movie
app.get('/movies/:title', passport.authenticate('jwt', {session: false}), async (req, res) => {
  Movies.findOne({ title: req.params.title })
    .then ((movie) => {
      res.json(movie);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

//Get genre 
app.get('/genre/:name', passport.authenticate('jwt', {session: false}), (req, res) => {
  Movies.findOne({ "genre.name": req.params.name })
    .then((movie) => {
      res.json(movie.genre.description);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error " + err);
    });

});

//Get director of movie
app.get('/director/:name', passport.authenticate('jwt', {session: false}), (req, res) => {
  Movies.findOne({ "director.name": req.params.name })
    .then((movie) => {
      res.json(movie.director);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error " + err);
    });

});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});