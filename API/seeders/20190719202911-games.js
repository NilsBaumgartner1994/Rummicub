'use strict';

const models = require('./../models');

/**
const resourceJSONs = [
  {
    "id": 1,
  },
  {
    "id": 2,
  }
];
*/

const resourceJSONs = [

];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    let modelSync = await models.sequelize.sync();
    //console.log("Okay models should now be synced");

    for(let i=0; i<resourceJSONs.length; i++){
      let resourceJSON = resourceJSONs[i];

      let model = await models.Game.findOne({where: resourceJSON} );
      if(!!model){
        await model.destroy();
        model = await models.Game.findOne({where: resourceJSON} );
      }
      if(model==null){
        model = models.Game.build( resourceJSON );
        await model.save();
      }
    }

    return;
  },

  down: async (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('People', null, {});
    */

    for(let i=0; i<resourceJSONs.length; i++){
      let resourceJSON = resourceJSONs[i];

      let model = await models.Game.findOne({where: resourceJSON} );
      if(model==null){
        await model.delete();
      }
    }

    return
  }
};
