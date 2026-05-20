

async function trigger() {
  console.log('Sending GET request to http://localhost:3000/api/run-migration...');
  try {
    const res = await fetch('http://localhost:3000/api/run-migration');
    const data = await res.json();
    console.log('Response status:', res.status);
    console.log('Response data:', data);
  } catch (err) {
    console.error('Fetch failed:', err.message);
  }
}

trigger();
