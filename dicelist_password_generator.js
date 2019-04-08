require('dotenv').config();
const apiKey = process.env.RANDOMORG_API_KEY;
const apiURL = 'https://api.random.org/json-rpc/1/invoke';
// const apiURL = 'http://localhost:3000/invoke' // mock url

const axios = require('axios');
const fs = require('fs');
const fsPromises = fs.promises;

// Globals
let REMAINING_API_REQUESTS = null;
let REROLL_LIMIT = 5;
let PASSWORD_LENGTH_LIMIT = 7;

//
// ─── UTILITY FUNCTIONS ──────────────────────────────────────────────────────────
//

async function readWordlistFile(filename) {
  const fh = await fsPromises.open(filename, 'r');
  let result = await fh.readFile({ encoding: 'utf-8', flag: 'r' });

  // map file contents into indexable object
  result = Object.assign(
    {},
    ...result.split('\n').map((row) => {
      return { [row.split(' ')[0]]: row.split(' ').slice(1) };
    })
  );

  await fh.close();
  return result;
}

async function selectWordlists(numWords) {
  // get list of wordlist files from local folder
  let fileNames = await fsPromises.readdir('wordlists/');

  // roll to select a random wordlist from list of files
  let wordlistRes = await axios.post(apiURL, {
    jsonrpc: '2.0',
    method: 'generateIntegers',
    params: {
      apiKey: apiKey,
      n: numWords,
      min: 0,
      max: fileNames.length - 1
    },
    id: 1
  });

  let wordlistRoll = wordlistRes.data.result.random.data;
  return wordlistRoll.map((index) => fileNames[index]);
}

async function selectWord(words) {
  let result = undefined;
  let rollCount = 0;

  while (!result) {
    if (rollCount >= REROLL_LIMIT) {
      throw Error('Max re-rolls exceeded, try rerunning the generator');
    }
    // 'diceroll' random number scheme
    let wordRes = await axios.post(apiURL, {
      jsonrpc: '2.0',
      method: 'generateIntegers',
      params: {
        apiKey: apiKey,
        n: 5,
        min: 1,
        max: 6
      },
      id: 2
    });
    REMAINING_API_REQUESTS = wordRes.data.result.requestsLeft;
    ++rollCount;

    let diceroll = wordRes.data.result.random.data.join('');
    console.log('Diceroll: ', diceroll);
    result = words[diceroll];
    // roll until a word match is found
    if (!result) {
      console.log(`No word(s) found at ${diceroll}, re-rolling...`);
    }
  }

  // if there are multiple words mapped to a roll, pick one randomly
  if (result.length > 1) {
    let multiWordRes = await axios.post(apiURL, {
      jsonrpc: '2.0',
      method: 'generateIntegers',
      params: {
        apiKey: apiKey,
        n: 1,
        min: 0,
        max: result.length - 1
      },
      id: 3
    });

    REMAINING_API_REQUESTS = multiWordRes.data.result.requestsLeft;
    result = result[multiWordRes.data.result.random.data[0]];
  } else {
    result = result[0]; // flatten single word array
  }

  return result;
}

//
// ─── PASSWORD GENERATOR MAIN ────────────────────────────────────────────────────────
//

(async function main() {
  try {
    if (!apiKey) {
      throw Error('No API key, please add one to .env in the root directory');
    }
    let pLength = process.argv[2];
    if (!Number(pLength)) {
      pLength = 3;
    } else if (pLength > PASSWORD_LENGTH_LIMIT) {
      console.log(`Password length limit is set to ${PASSWORD_LENGTH_LIMIT}`);
      pLength = PASSWORD_LENGTH_LIMIT;
    }
    console.log(`Generating random password length ${pLength}...`);
    // Get a wordlist for each word to be used in the password
    let passwordWordlists = await selectWordlists(pLength);
    console.log('Wordlists:\n', passwordWordlists);

    // For each word list, select a randomly chosen word
    let passwordPS = await passwordWordlists.map(async (wordlist) => {
      let words = await readWordlistFile(`wordlists/${wordlist}`);
      let word = await selectWord(words);
      return word;
    });

    // wait for async map functions to finish
    const password = await Promise.all(passwordPS);

    // print results
    console.log('\nYour randomly generated password:');
    console.log('\x1b[36m', password.join(' '), '\x1b[37m');
    console.log('\nRemaining API Requests:');
    console.log('\x1b[33m', `${REMAINING_API_REQUESTS}\n`);
  } catch (e) {
    console.error(e);
  }
})();
