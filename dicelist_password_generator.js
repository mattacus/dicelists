require('dotenv').config();
const apiKey = process.env.RANDOMORG_API_KEY;
const apiURL = 'https://api.random.org/json-rpc/1/invoke';

const axios = require('axios')
const fs = require('fs');
const fsPromises = fs.promises;

//
// ─── UTILITY FUNCTIONS ──────────────────────────────────────────────────────────
//

async function readWordlistFile(filename) {
  const fh = await fsPromises.open(filename, 'r');
  let result = await fh.readFile({encoding: 'ascii', flag: 'r'});
  // map file contents into indexable object
  result = Object.assign({}, 
    ...(result.split('\n').map(row => { 
      return { [row.split(' ')[0]]: row.split(' ').slice(1) }
    })));

  await fh.close();
  
  return result;
}

async function selectWordlist() {
  // let response = await axios.post(apiURL,
  //   {
  //     "jsonrpc": "2.0",
  //     "method": "generateIntegers",
  //     "params": {
  //       "apiKey": apiKey,
  //       "n": 3,
  //       "min": 0,
  //       "max": 15
  //     },
  //     "id": 42
  //   }
  // )
  console.log(response.data.result)
  console.log(response.data.result.data)
}

async function selectWord() {

}

//
// ─── PASSWORD GENERATOR MAIN ────────────────────────────────────────────────────────
//

(async function main() {
  try {
    // let words = await readWordlistFile('wordlists/Polish-dice.txt')
    console.log(apiKey)
    selectWordlist()
  } catch (e) {
    console.error(e)
  }
})();
