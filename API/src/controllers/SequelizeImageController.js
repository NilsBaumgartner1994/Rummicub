
/**
 * Default Photo Helper for Resources. Crop and Saves images to disk.
 */
export default class SequelizeImageController {
    /**
     * Constructor of the default photo helper
     * @param logger the logger which should be used
     * @param models the models from sequelize
     * @param myExpressRouter the express router
     */
    constructor(logger, models, expressApp, myAccessControl, myExpressRouter) {
        this.logger = logger;
        this.models = models;
        this.expressApp = expressApp;
        this.myAccessControl = myAccessControl;
        this.myExpressRouter = myExpressRouter;
    }

}
