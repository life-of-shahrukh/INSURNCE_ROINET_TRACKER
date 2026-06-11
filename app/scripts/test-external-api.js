#!/usr/bin/env node

/**
 * JavaScript version of API test script
 * Run with: node test-external-api.js
 */

const EXTERNAL_API_BASE = 'https://uatserviceapi.roinet.in';

async function testApi(endpoint, body) {
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
    console.error(`❌ Error:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Testing RoiNet Cognitensor API');
  console.log('=================================\n');

  // Test 1: List States
  console.log('\n📍 TEST 1: List States');
  const states = await testApi('/Cognitensor/ListState', '');

  // Test 2: List Districts
  console.log('\n📍 TEST 2: List Districts');
  if (states && Array.isArray(states) && states.length > 0) {
    // Try different possible field names
    const firstStateId = states[0].id || states[0].stateId || states[0].Id || states[0].StateId || '2';
    console.log(`Using state ID: ${firstStateId}`);
    await testApi('/Cognitensor/ListDistrict', { stateid: firstStateId });
  } else {
    // Fallback to known ID
    console.log('Using fallback state ID: 2');
    await testApi('/Cognitensor/ListDistrict', { stateid: '2' });
  }

  // Test 3: List Cities
  console.log('\n📍 TEST 3: List Cities');
  console.log('Using district ID: 387');
  await testApi('/Cognitensor/ListCity', { districtid: '387' });

  // Test 4: List Hierarchy User Data
  console.log('\n📍 TEST 4: List Hierarchy User Data');
  await testApi('/Cognitensor/ListHierarchyUserData', '');

  console.log('\n✨ All tests complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Review the actual response structure above');
  console.log('2. Update TypeScript types in external-api-types.ts');
  console.log('3. Update API client in external-api.ts if needed');
}

// Run tests
runTests().catch(console.error);
