/* eslint-disable prettier/prettier */
const mongoose = require('mongoose');

// eslint-disable-next-line import/no-extraneous-dependencies
const slugify = require('slugify');
//const User = require('./userModel');

// eslint-disable-next-line import/no-extraneous-dependencies
//const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'], //validator
      maxlength: [35, 'A tour name must have less or eqaul than 35 chars'],
      minlength: [10, 'A tour name must have greater or eqaul than 10 chars'],
      unique: true,
      // validate: [
      //   validator.isAlpha,
      //   'Tour name must only contain chars',
      // ],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        //only for strings
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is not valid here !',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
    },

    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //this only points to current doc on NEW Document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have an image'],
    },
    images: {
      type: [String],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: {
      type: [Date],
    },
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  }, //till here schema definition
  {
    //options
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema
  .virtual('durationWeeks') //this field is not part of the database
  .get(function () {
    return this.duration / 7; //this will be pointing to current doc
    //when we wanna use this we will normally use function()
  });

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//DOC MIDDLEWARE:RUNS BEFORE .SAVE() AND .CREATE() COMMAND
tourSchema.pre('save', function (next) {
  //console.log(this);
  this.slug = slugify(this.name, { lower: true });
  next();
});

//For Embedding Users into tours...code

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);

//   next();
// });

tourSchema.post('save', (doc, next) => {
  //console.log('hola!!');
  next();
});

//QUERY MIDDLEWARE:

tourSchema.pre(/^find/, function (next) {
  // tourSchema.pre('find', function (next) {

  // console.log(this);
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

// tourSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'guides',
//     select: '-__v -passwordChangedAt',
//   });
//   next();
// });

tourSchema.post(/^find/, (docs, next) => {
  // console.log(
  //   `Query took ${
  //     Date.now() - this.start
  //   } seconds`,+
  // );
  next();
});

//AGGREGATION MIDDLEWARE:

// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({
//     $match: { secretTour: { $ne: true } },
//   });
//   console.log(this);
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
