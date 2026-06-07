# RoiNet Cognitensor API - Postman Collection

## Overview

This Postman collection contains API endpoints for the RoiNet Cognitensor service, which provides location data (States, Districts, Cities) and hierarchical user data.

## Import Instructions

### Method 1: Import from File
1. Open Postman
2. Click **Import** button (top left)
3. Select **Upload Files** tab
4. Choose `RoiNet_Cognitensor_API.postman_collection.json`
5. Click **Import**

### Method 2: Import from Link
1. Open Postman
2. Click **Import** > **Link**
3. Paste the file path or URL
4. Click **Continue** > **Import**

## Environment Variables

The collection uses the following environment variable:

| Variable | Value | Description |
|----------|-------|-------------|
| `base_url` | `https://uatserviceapi.roinet.in` | Base URL for UAT environment |

### Setting Up Environment

**Option 1: Automatic (Collection Variable)**
- The collection has `base_url` pre-configured
- No additional setup needed

**Option 2: Create Custom Environment**
1. Click **Environments** in left sidebar
2. Click **+** to create new environment
3. Add variable:
   - Variable: `base_url`
   - Initial Value: `https://uatserviceapi.roinet.in`
   - Current Value: `https://uatserviceapi.roinet.in`
4. Save environment
5. Select environment in top-right dropdown

### For Production
Create a new environment with:
- Variable: `base_url`
- Value: `https://serviceapi.roinet.in` (or actual production URL)

## API Endpoints

### 1. Location APIs

#### List States
- **Method**: POST
- **Endpoint**: `/Cognitensor/ListState`
- **Body**: Empty
- **Description**: Retrieves list of all states

**Example Response:**
```json
[
  {
    "id": "1",
    "name": "Maharashtra",
    "code": "MH"
  },
  {
    "id": "2",
    "name": "Karnataka",
    "code": "KA"
  }
]
```

#### List Districts
- **Method**: POST
- **Endpoint**: `/Cognitensor/ListDistrict`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "stateid": "2"
}
```
- **Description**: Retrieves districts for a specific state

**Example Response:**
```json
[
  {
    "id": "387",
    "name": "Bangalore Urban",
    "stateId": "2"
  },
  {
    "id": "388",
    "name": "Mysore",
    "stateId": "2"
  }
]
```

#### List Cities
- **Method**: POST
- **Endpoint**: `/Cognitensor/ListCity`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "districtid": "387"
}
```
- **Description**: Retrieves cities for a specific district

**Example Response:**
```json
[
  {
    "id": "1001",
    "name": "Bangalore",
    "districtId": "387"
  },
  {
    "id": "1002",
    "name": "Whitefield",
    "districtId": "387"
  }
]
```

### 2. User APIs

#### List Hierarchy User Data
- **Method**: POST
- **Endpoint**: `/Cognitensor/ListHierarchyUserData`
- **Body**: Empty
- **Description**: Retrieves hierarchical user data

**Example Response:**
```json
[
  {
    "userId": "1",
    "name": "Admin User",
    "role": "ADMIN",
    "level": 1,
    "parentId": null
  },
  {
    "userId": "2",
    "name": "Manager User",
    "role": "MANAGER",
    "level": 2,
    "parentId": "1"
  }
]
```

## Usage Flow

### Getting Location Data
```
1. Call List States → Get state IDs
2. Call List Districts with stateid → Get district IDs
3. Call List Cities with districtid → Get cities
```

### Example Flow
```bash
# Step 1: Get states
POST /Cognitensor/ListState
Response: [{ id: "2", name: "Karnataka" }]

# Step 2: Get districts for Karnataka (id: 2)
POST /Cognitensor/ListDistrict
Body: { "stateid": "2" }
Response: [{ id: "387", name: "Bangalore Urban" }]

# Step 3: Get cities for Bangalore Urban (id: 387)
POST /Cognitensor/ListCity
Body: { "districtid": "387" }
Response: [{ id: "1001", name: "Bangalore" }]
```

## Testing the Collection

### Test Individual Request
1. Select a request from the collection
2. Click **Send** button
3. View response in the **Body** tab

### Test All Requests (Collection Runner)
1. Right-click on collection name
2. Select **Run collection**
3. Configure settings:
   - Iterations: 1
   - Delay: 0ms
4. Click **Run RoiNet Cognitensor API**
5. View results

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "error": "Invalid state ID",
  "message": "State ID must be a valid number"
}
```
**Solution**: Check request body format and values

#### 404 Not Found
```json
{
  "error": "Not found",
  "message": "No data found for the given ID"
}
```
**Solution**: Verify the ID exists by calling parent API first

#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An error occurred while processing your request"
}
```
**Solution**: Contact API support team

## Integration with Application

### Backend Integration (NestJS)

```typescript
// Create a service to call these APIs
import { Injectable, HttpService } from '@nestjs/common';

@Injectable()
export class CognitensorService {
  constructor(private readonly http: HttpService) {}

  async getStates() {
    const response = await this.http.post(
      'https://uatserviceapi.roinet.in/Cognitensor/ListState',
      ''
    ).toPromise();
    return response.data;
  }

  async getDistricts(stateId: string) {
    const response = await this.http.post(
      'https://uatserviceapi.roinet.in/Cognitensor/ListDistrict',
      { stateid: stateId },
      { headers: { 'Content-Type': 'application/json' } }
    ).toPromise();
    return response.data;
  }

  async getCities(districtId: string) {
    const response = await this.http.post(
      'https://uatserviceapi.roinet.in/Cognitensor/ListCity',
      { districtid: districtId },
      { headers: { 'Content-Type': 'application/json' } }
    ).toPromise();
    return response.data;
  }

  async getHierarchyUserData() {
    const response = await this.http.post(
      'https://uatserviceapi.roinet.in/Cognitensor/ListHierarchyUserData',
      ''
    ).toPromise();
    return response.data;
  }
}
```

### Frontend Integration (React/Next.js)

```typescript
// API client
const API_BASE = 'https://uatserviceapi.roinet.in';

export const cognitensorApi = {
  getStates: async () => {
    const res = await fetch(`${API_BASE}/Cognitensor/ListState`, {
      method: 'POST',
      body: ''
    });
    return res.json();
  },

  getDistricts: async (stateId: string) => {
    const res = await fetch(`${API_BASE}/Cognitensor/ListDistrict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stateid: stateId })
    });
    return res.json();
  },

  getCities: async (districtId: string) => {
    const res = await fetch(`${API_BASE}/Cognitensor/ListCity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ districtid: districtId })
    });
    return res.json();
  },

  getHierarchyUserData: async () => {
    const res = await fetch(`${API_BASE}/Cognitensor/ListHierarchyUserData`, {
      method: 'POST',
      body: ''
    });
    return res.json();
  }
};
```

## Notes

- All endpoints use **POST** method
- Some endpoints have **empty body** (List States, List Hierarchy User Data)
- Base URL for UAT: `https://uatserviceapi.roinet.in`
- Content-Type header should be `application/json` for endpoints with body
- Response format may vary - check actual API responses

## Troubleshooting

### Issue: CORS Error
**Solution**: Use a proxy or enable CORS on the server

### Issue: Connection Timeout
**Solution**: Check network connectivity and API server status

### Issue: Invalid Response Format
**Solution**: Check if API has been updated, verify with API team

## Support

For API issues or questions:
- Contact: RoiNet API Support Team
- Environment: UAT
- Base URL: https://uatserviceapi.roinet.in

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | June 7, 2026 | Initial collection created with 4 endpoints |

---

**Last Updated**: June 7, 2026  
**Collection Version**: 1.0.0
