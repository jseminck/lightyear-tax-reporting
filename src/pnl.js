const rates = require('./usd-eur-rates.js');
const lightyearApi = require('./lightyear-api');
const readStatement = require('./statement-reader');

async function run() {
    const activitiesPerInstrument = {};

    // set statement csv
    await readStatement('./statements/LightyearStatement-2021-06-22_2022-04-13.csv', row => {
        if ((row[3] != 'Buy' && row[3] != 'Sell') || row[2] == null) {
            return;
        }

        const date = row[0].split(' ')[0].split('/').reverse().map(i => i.length === 1 ? `0${i}` : i).join('-');
        const symbol = row[2];
        const side = row[3];
        const quantity = parseFloat(row[4]);
        const price = parseFloat(row[6]);

        if (activitiesPerInstrument[symbol] == null) {
            activitiesPerInstrument[symbol] = [{date, symbol, side, quantity, price}]
        } else {
            activitiesPerInstrument[symbol].push({date, symbol, side, quantity, price})
        }
    });

    Object.values(activitiesPerInstrument).forEach(activities => activities.reverse());

    let finalPnl = 0;
    let finalTaxes = 0;
    const sells = [];

    Object.keys(activitiesPerInstrument).forEach(key => {
        const buys = [];

        activitiesPerInstrument[key].forEach(activity => {
            const date = activity.date.substring(0,10);
            const rateObject = rates.filter(rate => rate.date == date)[0];

            // let usdToEurRate = 1
            // const symbol = '$'
            const symbol = '€'

            // rates are in usd-eur-rates.js and are manually taken from the ecb
            // rates for 2022 aren't added yet, so if you want to calculate 2022
            // data for fun, comment out this part and set usdToEurRate to 1 (above)
            // also change the reporting symbol if you want it to look correctly
            if (rateObject) {
                usdToEurRate = 1 / rateObject.rate;
            } else {
                console.log(`No rate found on date ${date}`)
            }

            activity.price = activity.price * usdToEurRate;

            if (activity.side == 'Buy') {
                // uncomment if you want to
                // console.log(`${date}: Bought ${activity.quantity} shares for ${symbol}${(activity.price).toFixed(3)} of ${activity.symbol} (${symbol}${(activity.price / activity.quantity).toFixed(3)} price per share)`);

                buys.push({
                    quantity: activity.quantity,
                    price: activity.price / activity.quantity,
                })
            } else {
                let sellQuantity = activity.quantity;
                let buyingQuantity = 0;
                let buyingPrice = 0;

                while (sellQuantity > 0) {
                    const buy = buys[0];

                    if (!buy) {
                        sellQuantity = 0;
                    } else {
                        if (buyingPrice == 0) {
                            buyingPrice = buy.price;
                            buyingQuantity = buy.quantity;

                            if (buy.quantity > sellQuantity) {
                                sellQuantity = 0;
                                buy.quantity -= sellQuantity;
                            } else {
                                sellQuantity -= buy.quantity;
                                buys.shift();
                            }

                        } else {
                            const totalQuantity = buyingQuantity + buy.quantity;
                            const curPercentage = buyingQuantity / totalQuantity;
                            const buyPercentage = buy.quantity / totalQuantity;

                            buyingPrice = (curPercentage * buyingPrice) + (buyPercentage * buy.price);
                            buyingQuantity += buy.quantity;

                            if (buy.quantity > (sellQuantity - totalQuantity)) {
                                sellQuantity = 0;
                                buy.quantity -= (sellQuantity - totalQuantity);
                            } else {
                                sellQuantity -= buy.quantity;
                                buys.shift();
                            }
                        }
                    }
                }

                const pnl = (activity.price - (activity.quantity * buyingPrice)).toFixed(3);

                sells.push({
                    date: date,
                    string: `${date}: Sold ${activity.quantity} shares for ${symbol}${activity.price.toFixed(3)} of ${activity.symbol} (average buying price: ${symbol}${buyingPrice.toFixed(3)} -- selling price: ${symbol}${(activity.price / activity.quantity).toFixed(3)} pnl: ${pnl})`
                })

                finalPnl += (activity.price - (activity.quantity * buyingPrice));
                finalTaxes += ((activity.price - (activity.quantity * buyingPrice)) / 100 * 20);
            }
        })
    })

    sells.sort((a,b) => a.date < b.date ? -1 : 1);
    sells.forEach((sell) => console.log(sell.string));

    console.log(`Final pnl: ${symbol}${finalPnl}`);
    console.log(`Final taxes: ${symbol}${finalTaxes}`);
}

function transformInstruments(instruments) {
    return instruments.reduce((map, instrument) => {
        map[instrument.id] = instrument;
        return map;
    }, {})
}

run();

