import TelegramBot from 'node-telegram-bot-api';
import i18n from 'i18n';
import { formatMoney, formatNumber, trans } from './src/utils';
import { Constants, Emoji, Symbols, TELEGRAM_TOKEN } from './src/constants';
import { AxiosService, CronService } from './src/configs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Coin, CronJobItem } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

i18n.configure({
    locales: ['en', 'vi'],
    directory: __dirname + '/src/locales',
    defaultLocale: 'en',
    register: global,
    autoReload: true,
});

const Bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// // Listen for any kind of message.
// Bot.on('message', (msg, match) => {
//     const { id: chatId } = msg.chat;

//     // send a message to the chat acknowledging receipt of their message
//     Bot.sendMessage(chatId, 'Received your message');
// });


let priceOldBTC_USDT = 0;
let priceChangeOld = 0;
let priceChangePercentOld = 0;
let startTime = (new Date()).getTime() - Constants.MS_1_DAY;;
let endTime = (new Date()).getTime();

// Listen when type "/run (symbol)".
Bot.onText(/\/run (.+)/, (msg, match) => {
    try {
        const { id: chatId } = msg.chat;
        let symbolMsg: string = match![1];
        let symbolResult = Symbols.BTCUSDT;
        let isExistSymbol = false;

        Object.keys(Symbols).forEach(key => {
            if (Symbols[key as keyof typeof Symbols].symbol === symbolMsg) {
                isExistSymbol = true;
                symbolResult = Symbols[key as keyof typeof Symbols];
            }
        });

        if (!isExistSymbol) {
            Bot.sendMessage(chatId, `Not found this symbol: "${symbolMsg}". Run default "BTC/USDT".`);
        }

        const jobService: CronJobItem = {
            name: symbolResult.symbol,
            type: Constants.CRON_TYPE.CRON_1m,
            callback: async () => {
                const resRatioLongShort = await AxiosService.get(`/futures/data/globalLongShortAccountRatio?symbol=${symbolResult.symbol}&period=5m&startTime=${startTime}&endTime=${endTime}`);
                const resRatioBuySell = await AxiosService.get(`/futures/data/takerlongshortRatio?symbol=${symbolResult.symbol}&period=5m&limit=500&startTime=${startTime}&endTime=${endTime}`);
                const resTicker = await AxiosService.get(`/fapi/v1/ticker/24hr`);

                let longShortRatio = 0;
                let buySellRatio = 0;
                let longVolume = 0;
                let shortVolume = 0;
                let coin: Coin = {
                    symbol: symbolResult.symbol,
                    priceChange: '',
                    priceChangePercent: '',
                    volume: '',
                    quoteVolume: '',
                    lastPrice: '',
                    count: 0
                };

                if ((resRatioLongShort?.response as any[])?.length > 0) {
                    const arrRatio: any[] = resRatioLongShort.response as any[];

                    longShortRatio = arrRatio[arrRatio.length - 1].longShortRatio;
                }

                if ((resRatioBuySell?.response as any[])?.length > 0) {
                    const arrRatio: any[] = resRatioBuySell.response as any[];

                    buySellRatio = arrRatio[arrRatio.length - 1].buySellRatio;

                    arrRatio.forEach(item => {
                        longVolume += Number(item.buyVol);
                        shortVolume += Number(item.sellVol);
                    })
                }

                if ((resTicker?.response as any[])?.length > 0) {
                    const itemFind = (resTicker?.response as any[]).find(item => item.symbol === symbolResult.symbol);
                    if (itemFind) {
                        coin = itemFind;
                    }
                }

                const { priceChange, priceChangePercent, lastPrice, volume, quoteVolume, count } = coin;

                const isHigherPrice = Number(lastPrice) > priceOldBTC_USDT;
                const isHigherPriceChange = Number(priceChange) > priceChangeOld;
                const isHigherPriceChangePercent = Number(priceChangePercent) > priceChangePercentOld;
                const totalLongShortVolume = longVolume + shortVolume;
                const sellRatio = (shortVolume / totalLongShortVolume) * 100;
                const buyRatio = (longVolume / totalLongShortVolume) * 100;

                priceOldBTC_USDT = Number(lastPrice);
                priceChangeOld = Number(priceChange);
                priceChangePercentOld = Number(priceChangePercent);
                startTime = (new Date()).getTime() - Constants.MS_1_DAY;
                endTime = (new Date()).getTime();

                const lang = i18n.getLocale();

                Bot.sendMessage(chatId, `${Emoji.sparkles} <strong>${symbolResult.label}</strong>\n${trans('price', lang)}: ${formatNumber(lastPrice)} ${isHigherPrice ? Emoji.large_blue_circle : Emoji.large_red_circle} \n${trans('volume_btc', lang)}: ${formatNumber(volume)} ${symbolResult.coin}\n${trans('volume_usd', lang)}: ${formatMoney(quoteVolume)}\n${trans('price_change_24h_percent', lang)}: ${priceChangePercent}% ${isHigherPriceChange ? Emoji.large_blue_circle : Emoji.large_red_circle}\n${trans('price_change_24h_usdt', lang)}: ${formatMoney(priceChange)} ${isHigherPriceChangePercent ? Emoji.large_blue_circle : Emoji.large_red_circle}\n${trans('traders', lang)}: ${formatNumber(count)}\n${trans('buy_sell_ratio', lang)}: ${buySellRatio}\n${trans('long_short_ratio', lang)}: ${longShortRatio}\n${trans('volume_short', lang)}: ${formatNumber(shortVolume)} ${symbolResult.coin} - ${trans('sell', lang)}/${trans('total', lang)}: ${formatNumber((sellRatio))}%\n${trans('volume_long', lang)}: ${formatNumber(longVolume)} ${symbolResult.coin} - ${trans('buy', lang)}/${trans('total', lang)}: ${formatNumber((buyRatio))}%\n${new Date()}`,
                    {
                        parse_mode: 'HTML'
                    });
            }
        };

        CronService.addCronJob(jobService);

        Bot.sendMessage(chatId, 'Service started');
    } catch (err) {
        console.log('run', err);
        CronService.removeAllCronJob();
    }
});

// Listen when type "/stop (symbol)".
Bot.onText(/\/stop (.+)/, (msg, match) => {
    try {
        const { id: chatId } = msg.chat;
        const symbol: string = match![1];

        CronService.removeCronJob(symbol);
        Bot.sendMessage(chatId, `Service ${symbol} stopped`);
    } catch (err) {
        console.log('stop', err);
        CronService.removeAllCronJob();
    }
});

// Listen when type "/stopAll".
Bot.onText(/\/stopAll/, (msg) => {
    try {
        const { id: chatId } = msg.chat;

        CronService.removeAllCronJob();
        Bot.sendMessage(chatId, 'All service stopped');
    } catch (err) {
        console.log('stop', err);
        CronService.removeAllCronJob();
    }
});

// Listen when type "/lang (vi or en)".
Bot.onText(/\/lang (.+)/, (msg, match) => {
    try {
        const { id: chatId } = msg.chat;
        const lang: string = match![1];
        i18n.setLocale(lang);
        Bot.sendMessage(chatId, `Language changed to ${lang}`);
    } catch (err) {
        console.log('lang', err);
        CronService.removeAllCronJob();
    }
});