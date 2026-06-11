/**
 * Test script to discover actual API responses
 * Run this to see what the RoiNet Cognitensor API actually returns
 */

const EXTERNAL_API_BASE = 'https://uatserviceapi.roinet.in';

async function testApi(endpoint: string, body: string | object) {
  console.log(`\n🔍 Testing: ${endpoint}`);
  console.log(`📤 Request body: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  
  try {
    const response = await fetch(`${EXTERNAL_API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log(`✅ Response:`, JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error(`❌ Error:`, error);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Testing RoiNet Cognitensor API');
  console.log('=================================\n');

  // Test 1: List States
  const states = await testApi('/Cognitensor/ListState', '');

  // Test 2: List Districts (if we got states)
  if (states && Array.isArray(states) && states.length > 0) {
    const firstStateId = states[0].id || states[0].stateId || states[0].Id;
    await testApi('/Cognitensor/ListDistrict', { stateid: firstStateId });
  } else {
    // Try with a known state ID
    await testApi('/Cognitensor/ListDistrict', { stateid: '2' });
  }

  // Test 3: List Cities
  await testApi('/Cognitensor/ListCity', { districtid: '387' });

  // Test 4: List Hierarchy User Data
  await testApi('/Cognitensor/ListHierarchyUserData', '');

  console.log('\n✨ Tests complete!');
}

// Run if this file is executed directly
if (require.main === module) {
  runTests();
}

export { testApi, runTests };
