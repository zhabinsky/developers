const {
  SEED,
  PAIR_COUNT,
  UPDATE_INTERVAL,
  FAILURE_CHANCE,
} = require ('../constants');

const Chance = require ('chance');
const chance = new Chance (SEED);

const ratesGenerator = require ('../ratesGenerator') ({
  generator: chance,
  pairCount: PAIR_COUNT,
  updateInterval: UPDATE_INTERVAL,
});

const express = require ('express');
const server = express ();

server.use ((req, res, next) => {
  res.header ('Access-Control-Allow-Origin', '*');
  next ();
});

server.get ('/configuration', (req, res) => {
  const appLoadTime = chance.integer ({min: 1000, max: 1001});
  setTimeout (() => {
    res.json ({
      currencyPairs: ratesGenerator.getCurrencyPairs (),
    });
  }, appLoadTime);
});

server.get ('/rates', (req, res) => {
  const hasFailed = chance.floating ({min: 0, max: 1}) < FAILURE_CHANCE;

  if (hasFailed) return res.sendStatus (500);
  
  try {
    const allRates = ratesGenerator.getCurrentRates ();
    const {currencyPairIds = ''} = req.query;

    let rates = {};
    for (let pairId of currencyPairIds.split (',')) {
      if (typeof allRates[pairId] !== 'undefined') {
        rates[pairId] = allRates[pairId];
      }
    }
    res.json ({rates});
  } catch (e) {
    res.sendStatus (400);
  }
});

const PORT = 3087;
server.listen (PORT, () => console.log (`Server is running on port ${PORT}`));