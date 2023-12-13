const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1. Get tour data from collection
  const tours = await Tour.find();

  // 2. Build template
  // 3. Render that template using tour data from step 1
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1. get data for the requested tour (including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug })
    .populate({
      path: 'reviews',
      fields: 'review rating user',
    })
    .populate('guides', ['name', 'guide', 'email', 'photo', 'role']);

  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }
  // console.log(req.params);
  // 2. Build template
  // 3. Render template using data from 1
  //console.log(window.location.href);

  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});

exports.getLoginForm = (req, res, next) => {
  console.log('Successfully login');
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getSignupForm = (req, res, next) => {
  console.log('Successfully sign up');
  res.status(200).render('signup', {
    title: 'sign-up your account',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};
