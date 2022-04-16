const fetch = require('node-fetch');

const BASE_URL = 'https://golightyear.com/api/v1';

module.exports = {
    fetchInstruments: fetchInstruments,
}

async function fetchInstruments() {
    const response = await lightyearFetch('/instrument');
    const instrumentsMap = transformInstruments(response);
    return instrumentsMap;
}

async function lightyearFetch(endpoint) {
    const rawResponse = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
            'content-type': 'application/json',
        }
    });
    const response = await rawResponse.json();
    return response;
}

function transformInstruments(instruments) {
    return instruments.reduce((map, instrument) => {
        map[instrument.symbol] = instrument;
        return map;
    }, {})
}