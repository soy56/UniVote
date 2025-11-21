const readline = require('readline');
const bcrypt = require('bcryptjs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

const ask = (question) =>
  new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()))
  });

(async () => {
  const password = await ask('Enter password to hash: ');
  if (!password) {
    console.error('Password cannot be empty.');
    process.exit(1);
  }

  const roundsRaw = await ask('Salt rounds (default 10): ');
  const rounds = Number.parseInt(roundsRaw, 10) || 10;

  const hash = await bcrypt.hash(password, rounds);
  console.log(`\nHash: ${hash}\n`);
  rl.close();
})();
