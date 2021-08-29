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

export class NewRound extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isLoading: true
        }
    }

    async componentDidMount() {
        const { match: { params } } = this.props;
        this.params = params;
        console.log(params);
        let gameId = null;
        if(!!this.params.id){
            gameId = this.params.id;
        }

        let players = await DataTableHelper.loadResourceFromServer("Players");
        let games = await DataTableHelper.loadResourceFromServer("Games");


        let lastGame = games[games.length-1];
        this.currentGameId = "?";
        if(!!lastGame){
            this.currentGameId = lastGame.id+1;
        }

        if(!!gameId){
            let playerGames = await DataTableHelper.loadResourceFromServer("PlayerGames",null,null,null,{GameId: parseInt(gameId)});
            console.log("Found Player Games");
            console.log(playerGames);
        }

        this.setState({
            isLoading: false,
            players : players,
            playerPoints: {},
            playerGames: {},
        });
    }

    renderHeader(){
        let title = "Neue Runde";
        let subtitle = "Trage die Punkte der Teilnehmer ein";

        return <HeaderTemplate title={title} subtitle={subtitle} />
    }

    renderSaveCard(){

    }

    handleEditPoints(player, event){
        console.log("handleEditPoints");
        let playerPoints = this.state.playerPoints;
        delete playerPoints[player.id];
        if(!!event){
            let value = event.target.value;
	    console.log(value);
            if(value!==""){
                playerPoints[player.id] = parseInt(value);
            }
        }
        this.setState({
            playerPoints: playerPoints
        })
    }

    renderClearValueButton(player){
        return <Button icon="pi pi-times" className="p-button-danger" onClick={() => this.handleEditPoints(player, null)} />;
    }

    renderPlayer(player){

        let name = player.name || player.id || "Spieler?";

        console.log(this.state.playerPoints);
        let playersPoints = this.state.playerPoints[player.id];
	let pointsGiven = !isNaN(playersPoints);
        let value = !pointsGiven ? "" : playersPoints;
        console.log("Value: "+value);

        let participated = pointsGiven;
        let filter = participated ? {} : {"filter":"grayscale(100%)"}

        return (
            <div className="p-col-6">
                <Card title={name}>
                    <div className="p-grid p-dir-col">
                        <img style={filter} width="100%" height="auto" src={player.image} />
                        <br></br>
                        <div className="p-inputgroup" style={{"width":"100%"}}>
                            <InputText inputmode="numeric" id="float-input" keyfilter={"int"} placeholder={"Punkte"} type="text" style={{"width":"80%"}} value={value} onChange={this.handleEditPoints.bind(this,player)} />
                            {this.renderClearValueButton(player)}
                        </div>
                    </div>
                </Card>
            </div>
        )
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

    async saveResults(){
        console.log("saveResults");
        let gamesRoute = await RouteHelper.getIndexRouteForResourceAsync("Games");
        let tableNamePlayerGames = "PlayerGames";
        let playerGameRoutes = await RouteHelper.getIndexRouteForResourceAsync(tableNamePlayerGames);
        if(!this.game){
            console.log("No game found, lets create it");
            let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_POST,gamesRoute,{});
            if(RequestHelper.isSuccess(answer)) {
                console.log("Game created");
                let game = answer.data;
                this.game = game;
                console.log("game saved");
            } else {
                this.game = null;
            }
        }

        if(!!this.game){
            console.log("Save for game");
            let playerPoints = this.state.playerPoints
            let playerIds = Object.keys(playerPoints);
            let playerGames = this.state.playerGames || {};
            let allSaved = true;
            for(let i=0; i<playerIds.length; i++){
                let playerId = playerIds[i];
                let playerGame = playerGames[playerId];

                let points = playerPoints[playerId];
                let newPlayerGame = {
                    points: points,
                    PlayerId : playerId,
                    GameId : this.game.id
                };

                if(!!playerGame && !!playerGame.id){
                    newPlayerGame.id = playerGame.id;
                }

                let answer = null;

                if(!!playerGame){ //Update playergame
                    console.log("Update PlayerGame check");
                    newPlayerGame.id = playerGame.id;
                    console.log("Update PlayerGame for "+playerId);
                    answer = await ResourceHelper.handleRequestTypeOnResource(newPlayerGame,tableNamePlayerGames,RequestHelper.REQUEST_TYPE_DELETE,{});
                    console.log("Deleted ?");
                    console.log("success delete: "+RequestHelper.isSuccess(answer)+"");
                } else { //Create new PlayerGame
                    console.log("Create PlayerGame for "+playerId);
                    answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_POST,playerGameRoutes,newPlayerGame);
                }

                if(!!answer && RequestHelper.isSuccess(answer)) {
                    let savedPlayerGame = answer.data;
                    playerGames[playerId] = savedPlayerGame;
                    console.log("Saved or updated");
                    console.log(savedPlayerGame);
                } else {
                    allSaved = false;
                }
            }
            console.log("All Saved: "+allSaved);
            this.setState({
                playerGames: playerGames,
            })
        }
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

    isAlreadySaved(){
        let playerGames = this.state.playerGames;
        let alreadySaved = false;
        if(!!playerGames){
            alreadySaved = Object.keys(playerGames).length > 0;
        }

        return alreadySaved;
    }

    renderSaveButton(){
        let playerPoints = this.state.playerPoints
        let amountPlayersAdded = Object.keys(playerPoints).length;
        let validRound = amountPlayersAdded > 1;

        let alreadySaved = this.isAlreadySaved();

        let label = alreadySaved ? "Update" : "Speichern";

        return (
            <div className="p-col-6">
                <div style={{width: "100%", "justify-content":"center", display:"flex"}}>
                    <Button style={buttonStyle} disabled={!validRound} className="p-button-raised" label={label} icon="pi pi-save" iconPos="right" onClick={() => {this.saveResults()}} />
                </div>
            </div>
        )
    }

    renderCurrentGameNumber(){
        return (
            <div className="p-col-6">
                <Card title={"Spiel Nr."}>
                    <div className="p-grid p-dir-col">
                        {this.currentGameId}
                    </div>
                </Card>
            </div>
        );
    }

    renderNextGameButton(){
        let alreadySaved = this.isAlreadySaved();

        let label = "Neue Runde";

        return (
            <div className="p-col-6">
                <div style={{width: "100%", "justify-content":"center", display:"flex"}}>
                    <Button style={buttonStyle} disabled={!alreadySaved} className="p-button-raised" label={label} icon="pi pi-plus" iconPos="right" onClick={() => {WindowHelper.openUrl("/game/new")}} />
                </div>
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
                    {this.renderCurrentGameNumber()}
                    {this.renderPlayers()}
                    {this.renderSaveButton()}
                    {this.renderNextGameButton()}
                </div>
            </div>
        </div>
    }
}
