import CronJob from 'cron';
import { Constants } from '../constants';
import { CronJobItem } from '../types';

const Cron = CronJob.CronJob;
let listCronRunning: CronJobItem[] = [];

// Cron job every 15 seconds
const CronJob_15s = new Cron(
    '*/15 * * * * *',
    () => { },
    null,
    true,
    Constants.TIMEZONE_CRON
);

// Cron job every 1 minute
const CronJob_1m = new Cron(
    '* * * * *',
    () => { },
    null,
    true,
    Constants.TIMEZONE_CRON
);

// Cron job every 5 minute
const CronJob_5m = new Cron(
    '*/5 * * * *',
    () => { },
    null,
    true,
    Constants.TIMEZONE_CRON
);

const addCronJob = (cronJobItem: CronJobItem) => {
    const { name, type, callback } = cronJobItem;

    let cronAdd = CronJob_15s;

    switch (type) {
        case Constants.CRON_TYPE.CRON_1m:
            cronAdd = CronJob_1m;
            break;
        case Constants.CRON_TYPE.CRON_5m:
            cronAdd = CronJob_5m;
            break;
        default:
            cronAdd = CronJob_15s;
    }

    if (callback) {
        cronAdd.addCallback(callback);
    }

    cronAdd.start();

    listCronRunning.push({
        name,
        cron: cronAdd
    });
}

const removeAllCronJob = () => {
    listCronRunning.forEach(item => {
        item.cron!.stop();
    })
}

const removeCronJob = (name: string) => {
    const itemFindIndex = listCronRunning.findIndex(item => item.name === name);

    if (itemFindIndex !== -1) {
        removeAllCronJob();
        listCronRunning.splice(itemFindIndex, 1);
        setTimeout(() => {
            listCronRunning.forEach(item => {
                item.cron!.start();
            });
        }, 1000)
    }
}



const CronService = {
    CronJob_15s,
    CronJob_1m,
    CronJob_5m,
    addCronJob,
    removeCronJob,
    removeAllCronJob
}

export default CronService;