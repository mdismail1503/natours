/* eslint-disable */
//const axios = require('axios');
//const showAlert = require('./alerts');

// ALERTS...
const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

const showAlert = (type, msg) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, 5000);
};

// LOGIN FUNCTIONALITY FROM FRONT END
const login = async (email, password) => {
  //console.log(email, password);
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email: email,
        password: password,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1000);
    }
    //  console.log(res);
  } catch (err) {
    // console.log(err.response.data);
    showAlert('error', err.response.data.message); //, err.response.data.message);
  }
};

const loginForm = document.querySelector('.form');

if (loginForm) {
  document.querySelector('.form').addEventListener('submit', (e) => {
    e.preventDefault(); // prevents the form loading other page..
    // VALUES
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

// Log out button..
const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });
    if (res.data.status === 'success') {
      location.reload(true);
      //console.log(res.data.statusText, 'HOla maaan!');
    }
  } catch (err) {
    showAlert('error', 'Error logging out! Try again.');
  }
};

const logOutBtn = document.querySelector('.nav__el--logout');
if (logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}
