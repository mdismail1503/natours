/* eslint-disable prettier/prettier */
// eslint-disable-next-line import/no-extraneous-dependencies
const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
};

exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
      role: req.body.role,
    });

    createSendToken(newUser, 201, res);
    //creating a token
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      data: err,
    });
  }
};

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1.check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and Password!', 400));
  }

  const user = await User.findOne({
    email,
  }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  //console.log(user);
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.clearCookie('jwt');
  res.status(200).json({ status: 'success' });
};
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  //1.Getting token and check if it's there
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    //console.log(token);
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return res.redirect('/');
  }
  //2.verifying token:super important
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3.check if the user still exists
  const currentUser = await User.findById(decoded.id);
  //console.log currentUser);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token does no longer exist', 401),
    );
  }

  //4.check if user changed password after the token was issued
  if (currentUser.changePasswordAfter(decoded.iat))
    return next(
      new AppError('User recently changed password! Please login again. ', 401),
    );

  //grant access to protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Only for rendered pages, no errors!..
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt === null) return next();
  if (req.cookies.jwt) {
    try {
      // 1. verify token..
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      // 2. Check if user still exists..
      const currentUser = await User.findById(decoded.id);
      //console.log currentUser);
      if (!currentUser) {
        return next();
      }

      //3.check if user changed password after the token was issued
      if (currentUser.changePasswordAfter(decoded.iat)) return next();

      //There is a logged in user..
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

// eslint-disable-next-line arrow-body-style
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array :['admin','lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403)); //403: forbidden
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get User based on Posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email address.', 404));
  }

  // 2. Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. Send the reset token to the user's email
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this.`;
  //console.log(resetURL);
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token is valid for 10 minutes',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to the email!',
    });
  } catch (err) {
    console.error(err);

    // If sending email fails, clean up the user's reset token and expiration
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!', 500),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1.get user based on the token
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2.if token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //3. Update chaangedpasswordAt property

  //4.Log the user in , send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = async (req, res, next) => {
  // 1.Get user from the collection
  const user = await User.findById(req.user.id).select('+password');

  // 2.Check if posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  // 3.if so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //user.findByIdAndUpdate will NOT work as intended !! so we use save.
  // 4.log user in, send JWT

  createSendToken(user, 200, res);
};
