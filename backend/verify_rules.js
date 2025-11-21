const axios = require('axios');

const API_URL = 'http://localhost:4000';

async function runVerification() {
    try {
        console.log('--- Starting Verification ---');

        // 1. Login as Admin
        console.log('1. Logging in as Admin...');
        const adminLogin = await axios.post(`${API_URL}/sign-in`, {
            identifier: 'SouvikPatra',
            password: 'password123'
        });
        const adminToken = adminLogin.data.token;
        console.log('   Admin logged in.');

        // 2. Reset Election
        console.log('2. Resetting Election...');
        await axios.post(`${API_URL}/election/phase`,
            { action: 'reset' },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log('   Election reset.');

        // 3. Configure Eligibility (Mechanical only)
        console.log('3. Configuring Eligibility (Mechanical only)...');
        await axios.patch(`${API_URL}/election/meta`,
            {
                title: 'Engineering Council Election',
                description: 'Vote for your representative.',
                eligibility: { departments: ['Mechanical'], years: [] }
            },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log('   Eligibility configured.');

        // 4. Add a Candidate (if none)
        const metaRes = await axios.get(`${API_URL}/election`);
        let candidateId;
        if (metaRes.data.candidates && metaRes.data.candidates.length > 0) {
            candidateId = metaRes.data.candidates[0].id;
            console.log(`   Using existing candidate: ${metaRes.data.candidates[0].name} (${candidateId})`);
        } else {
            // Add candidate
            console.log('   No candidates found, adding one...');
            const addCand = await axios.post(`${API_URL}/candidates`,
                { name: 'John Doe', tagline: 'For the people', manifesto: 'Vote for me' },
                { headers: { Authorization: `Bearer ${adminToken}` } }
            );
            candidateId = addCand.data.candidate.id;
            console.log(`   Candidate added: ${candidateId}`);
        }

        // 5. Start Election
        console.log('5. Starting Election...');
        await axios.post(`${API_URL}/election/phase`,
            { action: 'start' },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log('   Election started.');

        // 6. Test Eligible User (SouvikPatra - Mechanical)
        console.log('6. Testing Eligible User (SouvikPatra - Mechanical)...');
        try {
            await axios.post(`${API_URL}/votes`,
                { candidateId },
                { headers: { Authorization: `Bearer ${adminToken}` } }
            );
            console.log('   ✅ SUCCESS: Eligible user voted successfully.');
        } catch (err) {
            console.error('   ❌ FAILED: Eligible user could not vote.', err.response?.data || err.message);
        }

        // 7. Test Ineligible User (SouvikPatra@ - Civil)
        console.log('7. Testing Ineligible User (SouvikPatra@ - Civil)...');
        const userLogin = await axios.post(`${API_URL}/sign-in`, {
            identifier: 'SouvikPatra@',
            password: 'password123'
        });
        const userToken = userLogin.data.token;
        console.log('   Ineligible user logged in.');

        try {
            await axios.post(`${API_URL}/votes`,
                { candidateId },
                { headers: { Authorization: `Bearer ${userToken}` } }
            );
            console.error('   ❌ FAILED: Ineligible user WAS ALLOWED to vote (Unexpected).');
        } catch (err) {
            if (err.response && err.response.status === 403) {
                console.log('   ✅ SUCCESS: Ineligible user was blocked (403 Forbidden).');
                console.log('   Error Message:', err.response.data.message);
            } else {
                console.error('   ❌ FAILED: Unexpected error for ineligible user.', err.response?.status, err.response?.data || err.message);
            }
        }

        console.log('--- Verification Complete ---');

    } catch (error) {
        console.error('CRITICAL ERROR:', error.response ? error.response.data : error.message);
    }
}

runVerification();
