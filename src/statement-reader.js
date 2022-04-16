var fs = require('fs');
var {parse} = require('csv-parse');

module.exports = function readStatement(path, onRowRead) {
    return new Promise((resolve) => {
        fs.createReadStream(path)
        .pipe(parse({delimiter: ','}))
        .on('data', onRowRead)
        .on('end', resolve);
    });
}