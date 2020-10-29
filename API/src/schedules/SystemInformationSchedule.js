const schedule = require('node-schedule');
import SystemInformationHelper from '../helper/SystemInformationHelper';

/**
 *    *    *    *    *    *
 ┬    ┬    ┬    ┬    ┬    ┬
 │    │    │    │    │    │
 │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
 │    │    │    │    └───── month (1 - 12)
 │    │    │    └────────── day of month (1 - 31)
 │    │    └─────────────── hour (0 - 23)
 │    └──────────────────── minute (0 - 59)
 └───────────────────────── second (0 - 59, OPTIONAL)
 */

/**
 * The Environment Recorder Shedule logs every information about what is going on in the "real" world.
 * Like the machine information and weather which could be an intersting information for later anlysis
 */
export default class SystemInformationSchedule {

    static redisKey = "AllSystemData"; //key for local caching
    static redisCacheSeconds = 30;

    /**
     * Constructor of Environment
     * @param logger the logger for general purpose
     * @param systemLogger the logger for the machine
     * @param redisClient the redis client
     */
    constructor(logger, redisClient) {
        this.logger = logger;
        this.logger.info("[SystemInformationSchedule] initialising");
        this.redisClient = redisClient;
        this.logger.info("Created SystemInformationSchedule");
        this.initializeSchedule();
        this.logger.info("[SystemInformationSchedule] initialised");
    }

    /**
     * Method to prepare everything for the shedule
     * @returns {Promise<void>}
     */
    async initializeSchedule() {
        this.initializeMachineSchedule();
    }

    /**
     * Initialize the machine shedule
     * @returns {Promise<void>}
     */
    async initializeMachineSchedule() {
        //Execute a cron job every ten seconds
        const instance = this;
        let computerSchedule = schedule.scheduleJob('*/10 * * * * *', function () {
            instance.logSystemData();
        });
        this.computerSchedule = computerSchedule;
    }

    /**
     * Log the machine System data
     * @returns {Promise<void>}
     */
    async logSystemData() {
        let allInformations = await SystemInformationHelper.getAllSystemData();
        this.redisClient.setex(SystemInformationSchedule.redisKey, SystemInformationSchedule.redisCacheSeconds, JSON.stringify(allInformations));
    }

}