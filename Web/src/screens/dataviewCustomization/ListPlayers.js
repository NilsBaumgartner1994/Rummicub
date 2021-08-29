import React, {Component} from 'react';
import {Growl} from "../../components/growl/Growl";
import {HeaderTemplate} from "../../templates/HeaderTemplate";
import {DataTableHelper} from "../dataview/DataTableHelper";
import {ProgressSpinner} from "../../components/progressspinner/ProgressSpinner";
import {RequestHelper} from "../../sequelizeConnector/RequestHelper";
import {ResourceAssociationHelper} from "../../sequelizeConnector/ResourceAssociationHelper";
import {Card} from "../../components/card/Card";
import {RouteHelper} from "../../sequelizeConnector/RouteHelper";
import {ResourceHelper} from "../../sequelizeConnector/ResourceHelper";
import {Button} from "../../components/button/Button";
import {DefaultResourceDatatable} from "../dataview/DefaultResourceDatatable";
import {InputNumber} from "../../components/inputnumber/InputNumber";
import {InputText} from "../../components/inputtext/InputText";
import App from "../../App";
import {MyStorage} from "../../helper/MyStorage";
import {InputTextarea} from "../../components/inputtextarea/InputTextarea";
import {Accordion, AccordionTab} from "../../components/accordion/Accordion";
import {Fieldset} from "../../components/fieldset/Fieldset";
import {ToggleButton} from "../../components/togglebutton/ToggleButton";
import {DataTable} from "../../components/datatable/DataTable";
import {WindowHelper} from "../../helper/WindowHelper";
import {TabMenu} from "../../components/tabmenu/TabMenu";
import {Editor} from "../../components/editor/Editor";
import {APIRequest} from "../../sequelizeConnector/APIRequest";

const buttonSize = "100%"
const buttonStyle = {"font-size": "18px", width: buttonSize, "padding-top":"20px","padding-bottom":"20px"}

export class ListPlayers extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isLoading: true
        }
    }

    async componentDidMount() {
        let players = await DataTableHelper.loadResourceFromServer("Players");
        let playersPlayerGamesDict = await this.loadPlayersPlayerGames(players);
        let playersStatistics = this.calcPlayersPointStatistics(players, playersPlayerGamesDict);

        this.setState({
            isLoading: false,
            players: players,
            playersPlayerGamesDict: playersPlayerGamesDict,
            playersStatistics: playersStatistics,
        });
    }

    calcPlayersPointStatistics(players, playersPlayerGamesDict){
        let playersPointStatistics = {};
        for(let i=0; i<players.length; i++){
            let player = players[i];
            let playersGames = playersPlayerGamesDict[player.id];
            playersPointStatistics[player.id] = this.calcPlayerPointStatistic(player, playersGames)
        }
        return playersPointStatistics;
    }

    calcPlayerPointStatistic(player, playersGames){
        let statistics = {};
        statistics.amountGames = playersGames.length;
        let sum = 0;
	let worstRound = 0;
	let wins = 0;
	let amountGames = playersGames.length;
        for(let i=0; i<amountGames; i++){
            let playersGame = playersGames[i];
            let points = playersGame.points;
            sum+=points;
	    worstRound = worstRound < points ? points : worstRound;
	    wins = points === 0 ? wins+1 : wins;
        }
	statistics.wins = wins;
	statistics.looses = amountGames - wins;
	statistics.percentageWins = amountGames > 0 ? 100*((wins/amountGames).toFixed(2)) : "?";

        statistics.sum = sum;
        statistics.avg = 0;
	statistics.worstRound = worstRound;
        if(playersGames.length > 0){
            statistics.avg = statistics.sum / statistics.amountGames;
        }
        return statistics;
    }

    async loadPlayersPlayerGames(players){
        let playersPlayerGamesDict = {};
        for(let i=0; i<players.length; i++){
            let player = players[i];
            playersPlayerGamesDict[player.id] = await this.loadPlayerGames(player);
        }
        return playersPlayerGamesDict;
    }

    async loadPlayerGames(player){
        let playergames = await DataTableHelper.loadResourceFromServer("PlayerGames",null,null,null,{PlayerId: player.id});
        return playergames;
    }

    renderBackButton(){
        return (
            <div className="p-col-6">
                <div style={{width: "100%", "justify-content":"center", display:"flex"}}>
                    <Button style={buttonStyle} className="p-button-secondary" label="Zurück" icon="pi pi-arrow-left" iconPos="left" onClick={() => {WindowHelper.openUrl("/")}} />
                </div>
            </div>
        )
    }

    renderGameInformations(game){
        let playerGamesOfGames = this.state.playerGamesOfGames;
        let playerGamesOfGame = playerGamesOfGames[game.id];
        let playerDict = this.playerDict;

        let output = [];
        for(let i=0; i<playerGamesOfGame.length; i++){
            let playerGame = playerGamesOfGame[i];
            let player = playerDict[playerGame.PlayerId];
            let points = playerGame.points;
            output.push(<div>{player.name+": "+points}</div>);
        }

        return output;
    }

    renderPlayers(){
        let renderedPlayers = [];
        let players = this.state.players;
        if(!!players){
            let amountPlayers = players.length;
            for(let i=0; i<amountPlayers; i++){
                let player = players[i];
                renderedPlayers.push(this.renderPlayer(player));
            }
            if(amountPlayers%2==1){
                renderedPlayers.push(<div className="p-col-6"></div>);
            }
        }

        return renderedPlayers;
    }

    renderPlayer(player){

        let name = player.name || player.id || "Spieler?";

        let playersStatistics = this.state.playersStatistics;
        let playersStatistic = playersStatistics[player.id];

        let avg = playersStatistic.avg || 0;
        let amountGames = playersStatistic.amountGames || "?";
        let sum = playersStatistic.sum || "?";
	let worstRound = playersStatistic.worstRound || "?";
	let wins = playersStatistic.wins;
	let looses = playersStatistic.looses || "?";
	let percentageWins = playersStatistic.percentageWins || "?";

        return (
            <div className="p-col-6">
                <Card title={name}>
                    <div className="p-grid p-dir-col">
                        <img width="100%" height="auto" src={player.image} />
                        <br></br>
                        <div>{"Durchschnittliche Punkte: "+avg.toFixed(2)}</div>
                        <div>{"Anzahl Spiele: "+amountGames}</div>
                        <div>{"Punkte Gesamt: "+sum}</div>
			<div>{"Schlechteste Runde: "+worstRound}</div>
			<div>{"Gewonnen: "+wins+" - Verloren: "+looses}</div>
			<div>{percentageWins+" % Gewonnen"}</div>
                    </div>
                </Card>
            </div>
        )
    }

    render() {
        if(this.state.isLoading){
            return(
                <div><ProgressSpinner/></div>
            );
        }

        return <div>
            <Growl ref={(el) => this.growl = el} />

            <div className="content-section implementation">

                <div className="p-grid">
                    {this.renderBackButton()}
		    {this.renderBackButton()}
                    {this.renderPlayers()}
                </div>
            </div>
        </div>
    }
}
