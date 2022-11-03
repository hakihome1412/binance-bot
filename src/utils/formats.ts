export const formatMoney = (money: number | string) => {
    return Number(money).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
    });
}

export const formatNumber = (number: number | string) => {
    return Number(number).toLocaleString('en-US');
}