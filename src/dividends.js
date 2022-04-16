const rates = require('./usd-eur-rates.js');
const lightyearApi = require('./lightyear-api');
const readStatement = require('./statement-reader');

async function run() {
    const instruments = await lightyearApi.fetchInstruments();

    let finalPnl = 0;
    let finalTaxes = 0;

    await readStatement(row => {
        if (row[3] != 'Dividend') {
            return;
        }

        const date = row[0].split(' ')[0].split('/').reverse().map(i => i.length === 1 ? `0${i}` : i).join('-');
        const ticker = row[2];
        const instrument = instruments[ticker];

        const grossAmount = (parseFloat(row[6])).toFixed(4);
        const netAmount = (parseFloat(row[10])).toFixed(4);
        const taxAmount = (parseFloat(row[11] || '0')).toFixed(4);

        finalPnl += parseFloat(row[10]);
        finalTaxes += parseFloat(row[11] || '0');

        console.log(`${date} - ${ticker} - ${instrument.name} - Gross amount: ${grossAmount} - Tax amount: ${taxAmount}`);
    })

    console.log(`Final received: ${finalPnl.toFixed(4)}`);
    console.log(`Final taxes: ${finalTaxes.toFixed(4)}`);
}

run();

