async function test() {
  try {
    const tEmail = `t${Date.now()}@puj.edu.co`;
    const sEmail = `s${Date.now()}@puj.edu.co`;
    
    // 1. register teacher & login
    let r1 = await fetch('http://localhost:3000/auth/register', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ fullName: 'T', institutionalEmail: tEmail, password: 'Pass123!', role: 'teacher' }) });
    console.log('T REG:', r1.status, await r1.text());
    let r2 = await fetch('http://localhost:3000/auth/login', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ institutionalEmail: tEmail, password: 'Pass123!' }) });
    const tTokenBody = await r2.json();
    console.log('T LOGIN:', r2.status, tTokenBody);
    const { accessToken: tToken } = tTokenBody;

    // 2. register student & login
    let r3 = await fetch('http://localhost:3000/auth/register', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ fullName: 'S', institutionalEmail: sEmail, password: 'Pass123!', role: 'student' }) });
    console.log('S REG:', r3.status, await r3.text());
    let r4 = await fetch('http://localhost:3000/auth/login', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ institutionalEmail: sEmail, password: 'Pass123!' }) });
    const sTokenBody = await r4.json();
    console.log('S LOGIN:', r4.status, sTokenBody);
    const { accessToken: sToken } = sTokenBody;

    // 3. create course
    r = await fetch('http://localhost:3001/courses', { method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${tToken}`}, body: JSON.stringify({ name: 'C', description: 'C' }) });
    let t = await r.text();
    console.log('COURSE:', r.status, t);
    const courseId = JSON.parse(t).id || "123e4567-e89b-12d3-a456-426614174000";

    // 4. create evaluation
    r = await fetch('http://localhost:3002/evaluations', { method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${tToken}`}, body: JSON.stringify({ courseId, title: 'E', type: 'quiz', weight: 0.2 }) });
    t = await r.text();
    console.log('EVALUATION:', r.status, t);
    const evaluationId = JSON.parse(t).id || "123e4567-e89b-12d3-a456-426614174000";

    // 5. create attempt
    r = await fetch(`http://localhost:3002/evaluations/${evaluationId}/attempts`, { method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${sToken}`}, body: JSON.stringify({ courseId }) });
    t = await r.text();
    console.log('ATTEMPT:', r.status, t);
    const attemptId = JSON.parse(t).id;

    // 6. start attempt
    r = await fetch(`http://localhost:3002/attempts/${attemptId}/start`, { method: 'POST', headers: {'Authorization': `Bearer ${sToken}`} });
    console.log('START:', r.status, await r.text());

    // 7. submit attempt
    r = await fetch(`http://localhost:3002/attempts/${attemptId}/submit`, { method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${sToken}`}, body: JSON.stringify({ answers: [] }) });
    console.log('SUBMIT:', r.status, await r.text());

    // 8. grade attempt
    r = await fetch(`http://localhost:3002/attempts/${attemptId}/grade`, { method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${tToken}`}, body: JSON.stringify({ score: 85 }) });
    console.log('GRADE:', r.status, await r.text());
  } catch(e) {
    console.error(e);
  }
}
test();
