

interface Number {
    normalise(tickSize: string): number;
}

Number.prototype.normalise = function (tickSize: string) {
    return this.toFixed(tickSize.indexOf('1') - 1);
}