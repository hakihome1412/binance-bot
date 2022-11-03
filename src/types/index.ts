import { CronJob } from "cron"

export type Coin = {
    symbol: string,
    priceChange: string,
    priceChangePercent: string,
    weightedAvgPrice?: string,
    lastPrice: string,
    lastQty?: string,
    openPrice?: string,
    highPrice?: string,
    lowPrice?: string,
    volume: string,
    quoteVolume: string,
    openTime?: number,
    closeTime?: number,
    firstId?: number,
    lastId?: number,
    count: number,
}

export type CronJobItem = {
    name: string,
    type?: string,
    cron?: CronJob,
    callback?: () => Promise<void> | void;
}