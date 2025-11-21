const axios = require('axios');

const API_URL = 'http://localhost:4000';
const ADMIN_CREDENTIALS = { identifier: 'SouvikPatra', password: 'password123' };
const VOTER_CREDENTIALS = { identifier: 'SouvikPatra', password: 'password123' }; // Using admin as voter for simplicity, assuming they are eligible

async function run() {
    try {
        console.log('--- Starting Multi-Position Verification ---');

        // 1. Login as Admin
        console.log('Logging in as Admin...');
        const loginRes = await axios.post(`${API_URL}/sign-in`, ADMIN_CREDENTIALS);
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('Logged in.');

        // 2. Reset Election
        console.log('Resetting election...');
        await axios.post(`${API_URL}/election/phase`, { action: 'reset' }, { headers });
        console.log('Election reset.');

        // 3. Create Positions
        console.log('Creating positions...');
        const pos1 = await axios.post(`${API_URL}/positions`, { title: 'President', order: 1, maxVotes: 1 }, { headers });
        const pos2 = await axios.post(`${API_URL}/positions`, { title: 'Vice President', order: 2, maxVotes: 1 }, { headers });
        console.log('Positions created:', pos1.data.position.title, pos2.data.position.title);

        // 4. Create Candidates assigned to positions
        console.log('Creating candidates...');
        const c1 = await axios.post(`${API_URL}/candidates`, { name: 'Alice (Pres)', positionId: pos1.data.position.id }, { headers });
        const c2 = await axios.post(`${API_URL}/candidates`, { name: 'Bob (Pres)', positionId: pos1.data.position.id }, { headers });
        const c3 = await axios.post(`${API_URL}/candidates`, { name: 'Charlie (VP)', positionId: pos2.data.position.id }, { headers });
        console.log('Candidates created.');

        // 5. Start Election
        console.log('Starting election...');
        await axios.post(`${API_URL}/election/phase`, { action: 'start' }, { headers });
        console.log('Election started.');

        // 6. Vote for President
        console.log('Voting for President (Alice)...');
        await axios.post(`${API_URL}/votes`, { candidateId: c1.data.candidate.id }, { headers });
        console.log('Vote for President cast.');

        // 7. Try to vote for President again (should fail)
        console.log('Attempting second vote for President (Bob)...');
        try {
            await axios.post(`${API_URL}/votes`, { candidateId: c2.data.candidate.id }, { headers });
            console.error('FAIL: Second vote for President should have failed.');
        } catch (error) {
            console.log('SUCCESS: Second vote for President failed as expected:', error.response?.data?.message);
        }

        // 8. Vote for Vice President (should succeed)
        console.log('Voting for Vice President (Charlie)...');
        await axios.post(`${API_URL}/votes`, { candidateId: c3.data.candidate.id }, { headers });
        console.log('Vote for Vice President cast.');

        // 9. Delete Position (should succeed)
        console.log('Deleting President position...');
        await axios.delete(`${API_URL}/positions/${pos1.data.position.id}`, { headers });
        console.log('President position deleted.');

        console.log('--- Verification Complete: SUCCESS ---');

    } catch (error) {
        console.error('Verification FAILED:', error.response?.data || error.message);
    }
}

run();
