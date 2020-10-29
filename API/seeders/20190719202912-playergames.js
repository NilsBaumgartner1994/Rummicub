'use strict';

var models = require('./../models');


module.exports = {
  up: async (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkInsert('People', [{
        name: 'John Doe',
        isBetaMember: false
      }], {});
    */

    let modelSync = await models.sequelize.sync();
    //console.log("Okay models should now be synced");

    let players = await models.Player.findAll();
    let games = await models.Game.findAll();

    /**

    console.log("Games: "+games.length);

    for(let i=0; i<players.length; i++){
      let player = players[i];
      for(let j=0; j<games.length; j++){
        let game = games[j];
        console.log("############");

        let playerGamesList = await player.getPlayerGames();
        console.log("Player: "+player.name+" Found PlayerGames: "+playerGamesList.length);

        let playerGames = await player.addGame(game);
        let playerGame = playerGames[0];
        //console.log(player);

        playerGame.points = player.id+game.id;
        await playerGame.update();
        //console.log(playerGame);
        console.log("############");

      }
    }

     */

    return;
  },

  down: async (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('People', null, {});
    */

    return
  }
};
