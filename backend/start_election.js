const axios = require('axios');

const API_URL = 'http://localhost:4000';

async function startElection() {
    try {
        // 1. Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'SouvikPatra',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Logged in, token obtained.');

        // 2. Start Election
        const phaseRes = await axios.post(`${API_URL}/election/phase`,
            { action: 'start' },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Election started:', phaseRes.data);

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

startElection();
