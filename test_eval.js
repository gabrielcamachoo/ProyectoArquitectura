const fetch = require('node-fetch'); // or native fetch in newer node
async function run() {
  try {
    // 1. register
    const email = `test-${Date.now()}@puj.edu.co`;
    const r = await fetch('http://localhost:3000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'T', institutionalEmail: email, password: 'Pass123!', role: 'teacher' })
    });
    
    // 2. login
    const l = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ institutionalEmail: email, password: 'Pass123!' })
    });
    const { accessToken } = await l.json();
    
    // 3. create eval
    const c = await fetch('http://localhost:3002/evaluations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({
        courseId: 'course-001',
        title: 'Quiz 1',
        type: 'quiz',
        weight: 0.2,
        deadline: new Date().toISOString()
      })
    });
    console.log('STATUS:', c.status);
    console.log('BODY:', await c.text());
  } catch(e) {
    console.error(e);
  }
}
run();
