const bcrypt = require('bcryptjs');
const fs = require('fs');

const password = 'password';

bcrypt.hash(password, 10).then(newHash => {
    fs.writeFileSync('hash.txt', newHash);
});
