export function returnPercentageIncrease(newNumber, originalNumber) {
    const increase = ((newNumber - originalNumber) / originalNumber) * 100;
    return increase;
}