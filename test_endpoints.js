// Quick script to test if endpoints exist
const endpoints = [
  'http://localhost:4000/api/citas',
  'http://localhost:4000/api/citas/psicologos',
  'http://localhost:4000/api/citas/descansos',
  'http://localhost:4000/api/citas/disponibilidad'
];

async function testEndpoints() {
  console.log('🧪 Testing endpoints...\n');

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer fake-token'
        }
      });

      console.log(`${endpoint}`);
      console.log(`  Status: ${response.status} ${response.statusText}`);

      if (response.status === 404) {
        console.log(`  ❌ Endpoint not found`);
      } else if (response.status === 401) {
        console.log(`  ✅ Endpoint exists (auth error expected)`);
      } else {
        console.log(`  ℹ️  Status: ${response.status}`);
      }
      console.log('');

    } catch (error) {
      console.log(`${endpoint}`);
      console.log(`  ❌ Connection error: ${error.message}\n`);
    }
  }
}

testEndpoints();