const http = require('http');

const request = (method, path, body = null, cookie = null, auth = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1' + path,
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (cookie) options.headers['Cookie'] = cookie;
    if (auth) options.headers['Authorization'] = `Bearer ${auth}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data ? JSON.parse(data) : null
        });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

async function run() {
  console.log('1. Registering user...');
  const testEmail = `test${Date.now()}@example.com`;
  const regRes = await request('POST', '/auth/register', { email: testEmail, password: 'Password123' });
  console.log('Register status:', regRes.status);
  
  const setCookieHeader = regRes.headers['set-cookie']?.[0];
  const refreshTokenCookie = setCookieHeader ? setCookieHeader.split(';')[0] : null;
  const accessToken = regRes.data?.data?.accessToken;
  console.log('Got refresh token cookie:', !!refreshTokenCookie);
  console.log('Got access token:', !!accessToken);

  console.log('\n2. Testing /me endpoint...');
  const meRes = await request('GET', '/auth/me', null, null, accessToken);
  console.log('Me status:', meRes.status, meRes.data?.data?.user?.email);

  console.log('\n3. Testing Token Refresh Rotation...');
  const refreshRes = await request('POST', '/auth/refresh', null, refreshTokenCookie);
  console.log('Refresh status:', refreshRes.status);
  const newSetCookie = refreshRes.headers['set-cookie']?.[0];
  const newRefreshTokenCookie = newSetCookie ? newSetCookie.split(';')[0] : null;
  console.log('Got NEW refresh cookie:', !!newRefreshTokenCookie);
  console.log('Tokens rotated successfully:', refreshTokenCookie !== newRefreshTokenCookie);

  console.log('\n4. Testing Account Lockout (5 bad logins)...');
  for (let i = 1; i <= 6; i++) {
    const badLogin = await request('POST', '/auth/login', { email: testEmail, password: 'wrong' });
    console.log(`Attempt ${i}: Status ${badLogin.status}, Msg: ${badLogin.data?.error?.message}`);
  }

  console.log('\n5. Logout...');
  const logoutRes = await request('POST', '/auth/logout', null, newRefreshTokenCookie);
  console.log('Logout status:', logoutRes.status);
}

run().catch(console.error);
