const Review = require('../models/reviewModel');
//const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  //if theres no tour id on req we take it from the url for tour and
  //for user it come from protect middleware
  //Allows nested routes..
  if (!req.body.tour) req.body.tour = req.params.tourId;
  // if (!req.body.user)
  req.body.user = req.user.id;
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);

// exports.getReviews = catchAsync(async (req, res, next) => {
//   const review = await Review.findById(req.params.id)
//     .select('-__v')
//     .populate([
//       {
//         path: 'tour',
//         select: 'name',
//       },
//       {
//         path: 'user',
//         select: 'name',
//       },
//     ]);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       review: review.review,
//     },
//   });
// });
