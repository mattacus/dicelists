// Mock server to simulate results from random.org
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();

// parse application/json
app.use(bodyParser.json());

const mockData = JSON.parse(fs.readFileSync('mock/mock_data.json'));
console.log('Mock data available:\n', mockData);

app.post('/invoke', (req, res) => {
  console.log('/POST Request:');
  console.log(req.body);

  if (req.body.id === 1) {
    console.log('Wordlist roll: ')
    res.status(200).send(mockData.wordlists)

  } else if (req.body.id === 2) {
    console.log('Word roll: ')
    res.status(200).send(mockData.words)

  } else if (req.body.id === 3) {
    console.log('Multiword roll: ')
    res.status(200).send(mockData.multiWords)

  } else {
    console.log('Err: unknown id');
    res.status(400).send();
  }

});

app.listen(3000, () => console.log('Mock random.org server listening on port 3000'));
