/* eslint-disable prettier/prettier */
//Everything that is not related to Express to be written outside of app.js file
const mongoose = require('mongoose');

const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION 👎');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    //console.log(con.connections);
    console.log('DB connection successful');
  });
//.catch((err) => console.log('ERROR'));

//////for just testing.../////
// const testTour = new Tour({
//   //creating a document from Tour model
//   name: 'The Park Camper',
//   price: 997,
// });

// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log('ERROR⛔:', err);
//   }); //in order to save document to db

//console.log(process.env);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err);
  console.log('UNHANDLED REJECTION:⛔ SHUTTING DOWN');
  server.close(() => process.exit(1)); //0:SUCCESS 1:UNCAUGHT EXCEPTION
});

//console.log(x);
