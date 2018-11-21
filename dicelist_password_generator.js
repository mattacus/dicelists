require('dotenv').config();
const apiKey = process.env.RANDOMORG_API_KEY;
const apiURL = 'https://api.random.org/json-rpc/1/invoke';
// const apiURL = 'http://localhost:3000/invoke' // mock url

const axios = require('axios')
const fs = require('fs');
const fsPromises = fs.promises;

// Globals
let REMAINING_API_REQUESTS = null;

//
// ─── UTILITY FUNCTIONS ──────────────────────────────────────────────────────────
//


async function readWordlistFile(filename) {
  const fh = await fsPromises.open(filename, 'r');
  let result = await fh.readFile({encoding: 'utf-8', flag: 'r'});

  // map file contents into indexable object
  result = Object.assign({},
    ...(result.split('\n').map(row => {
      return { [row.split(' ')[0]]: row.split(' ').slice(1) }
    })));

  await fh.close();
  return result;
}

async function selectWordlists(numWords) {
  // get list of wordlist files from local folder
  let fileNames = await fsPromises.readdir('wordlists/');

  // roll to select a random wordlist from list of files
  let wordlistRes = await axios.post(apiURL,
    {
      "jsonrpc": "2.0",
      "method": "generateIntegers",
      "params": {
        "apiKey": apiKey,
        "n": numWords,
        "min": 0,
        "max": fileNames.length - 1
      },
      "id": 1
    }
  )
  
  let wordlistRoll = wordlistRes.data.result.random.data;
  return wordlistRoll.map(index => fileNames[index]);
}

async function selectWord(words) {

// 'diceroll' random number scheme
  let wordRes = await axios.post(apiURL,
      {
        "jsonrpc": "2.0",
        "method": "generateIntegers",
        "params": {
          "apiKey": apiKey,
          "n": 5,
          "min": 1,
          "max": 6
        },
        "id": 2
      }
  )

  let diceroll = wordRes.data.result.random.data.join('');
  console.log('Diceroll: ', diceroll)
  let result = words[diceroll];

  // if there are multiple words mapped to a roll, pick one randomly
  if(result.length > 1) {
    console.log('words length: ', result.length)

    let multiWordRes = await axios.post(apiURL,
      {
        "jsonrpc": "2.0",
        "method": "generateIntegers",
        "params": {
          "apiKey": apiKey,
          "n": 1,
          "min": 0,
          "max": result.length - 1
        },
        "id": 3
      }
    )

    console.log('word index: ', multiWordRes.data.result.random.data[0])

    REMAINING_API_REQUESTS = multiWordRes.data.result.requestsLeft;
    result = result[multiWordRes.data.result.random.data[0]];

  } else {
    REMAINING_API_REQUESTS = wordRes.data.result.requestsLeft;
    result = result[0];  // flatten single word array
  }

  return result;
}


//
// ─── PASSWORD GENERATOR MAIN ────────────────────────────────────────────────────────
//


(async function main() {
  try {
    // Get a wordlist for each word to be used in the password
    let passwordWordlists = await selectWordlists(3);
    console.log('Wordlists:\n', passwordWordlists);

    // For each word list, select a randomly chosen word
    let passwordPS = await passwordWordlists.map(async (wordlist) => {
      let words = await readWordlistFile(`wordlists/${wordlist}`);
      let word = await selectWord(words);
      return word;
    })

    // wait for async map functions to finish
    const password = await Promise.all(passwordPS);

    // print results
    console.log('\nYour randomly generated password:');
    console.log(password);
    console.log('\nRemaining API Requests:');
    console.log(REMAINING_API_REQUESTS);

  } catch (e) {
    console.error(e)
  }
})();
