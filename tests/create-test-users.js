const http = require('http');

const CREATE_USERS_NUMBER = 10;

const options = {
  hostname: 'localhost',
  port: 3030,
  path: '/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

for (let i = 0; i < CREATE_USERS_NUMBER; i++) {
  const request = http.request(options);
  request.write(
    JSON.stringify({
      name: `Test${i}`,
      email: `test${i}@test${i}.com`,
      password: `123`,
    }),
  );
  request.end();
}
