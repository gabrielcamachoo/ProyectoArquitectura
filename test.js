const url = 'http://localhost:8000';

async function test() {
  try {
    const email = `test-${Date.now()}@javeriana.edu.co`;
    console.log('Registering', email);
    const regRes = await fetch(`${url}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test User',
        institutionalEmail: email,
        password: 'Password123!',
        role: 'teacher'
      })
    });
    const regData = await regRes.json();
    console.log('Register response:', regRes.status, regData);

    console.log('Logging in...');
    const logRes = await fetch(`${url}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        password: 'Password123!'
      })
    });
    const logData = await logRes.json();
    console.log('Login response:', logRes.status);
    
    if (!logData.accessToken) {
      console.error('No token!');
      return;
    }

    console.log('Creating course...');
    const crsRes = await fetch(`${url}/courses`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${logData.accessToken}`
      },
      body: JSON.stringify({
        name: 'My API Test Course',
        description: 'Testing the API from script'
      })
    });
    console.log('Create Course response:', crsRes.status);
    const crsData = await crsRes.text();
    console.log(crsData);
  } catch(e) {
    console.error(e);
  }
}

test();
