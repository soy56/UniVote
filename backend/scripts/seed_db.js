const fs = require('fs/promises');
const path = require('path');
const { v4: uuid } = require('uuid');

const DATA_FILE = path.join(__dirname, '..', 'data.json');

const seedData = {
    election: {
        title: 'University Student Council Election 2024',
        description: 'Cast your vote for the future of our university! Choose your representatives wisely.',
        bannerImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1000',
        phase: 'Voting', // Set to Voting so it's active immediately
        votingStartsAt: Math.floor(Date.now() / 1000) - 3600, // Started 1 hour ago
        votingEndsAt: Math.floor(Date.now() / 1000) + 86400 * 7, // Ends in 7 days
        lastVoteAt: 0,
        lastVoter: null,
        eligibility: { departments: [], years: [] }
    },
    positions: [
        {
            id: uuid(),
            title: 'President',
            order: 1,
            maxVotes: 1
        },
        {
            id: uuid(),
            title: 'Vice President',
            order: 2,
            maxVotes: 1
        },
        {
            id: uuid(),
            title: 'General Secretary',
            order: 3,
            maxVotes: 1
        }
    ],
    candidates: [],
    votes: []
};

// Helper to create candidates
const createCandidate = (name, positionId, tagline, manifesto, imageUri) => ({
    id: uuid(),
    positionId,
    name,
    tagline,
    manifesto,
    imageUri,
    voteCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
});

const run = async () => {
    console.log('🌱 Seeding database...');

    // Add candidates for President
    const presidentId = seedData.positions.find(p => p.title === 'President').id;
    seedData.candidates.push(
        createCandidate(
            'Sarah Chen',
            presidentId,
            'Innovation for a Better Campus',
            'I promise to upgrade the library facilities and improve campus Wi-Fi.',
            'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400'
        ),
        createCandidate(
            'Marcus Johnson',
            presidentId,
            'Voice of the Students',
            'My goal is to ensure every student is heard and represented.',
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400'
        )
    );

    // Add candidates for Vice President
    const vpId = seedData.positions.find(p => p.title === 'Vice President').id;
    seedData.candidates.push(
        createCandidate(
            'Emily Davis',
            vpId,
            'Unity in Diversity',
            'Promoting cultural events and inclusivity on campus.',
            'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400'
        ),
        createCandidate(
            'David Kim',
            vpId,
            'Action, Not Just Words',
            'Focusing on practical solutions for student housing and transport.',
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400'
        )
    );

    // Add candidates for General Secretary
    const gsId = seedData.positions.find(p => p.title === 'General Secretary').id;
    seedData.candidates.push(
        createCandidate(
            'Priya Patel',
            gsId,
            'Transparency & Accountability',
            'Ensuring all council decisions are transparent and open.',
            'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&q=80&w=400'
        )
    );

    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(seedData, null, 2), 'utf8');
        console.log('✅ Database seeded successfully!');
        console.log(`   - ${seedData.positions.length} positions`);
        console.log(`   - ${seedData.candidates.length} candidates`);
        console.log(`   - Election phase set to: ${seedData.election.phase}`);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    }
};

run();
