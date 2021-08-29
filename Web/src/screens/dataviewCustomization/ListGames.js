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

export class ListGames extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isLoading: true
        }
    }

    async componentDidMount() {
        let players = await DataTableHelper.loadResourceFromServer("Players");
        let playerDict = this.parseDefaultResourceToDict(players);

        let offset = this.state.offset || 0;
        this.playerDict = playerDict;

        await this.loadGames();

        this.setState({
            isLoading: false,
            offset: offset,
        });
    }

    parseDefaultResourceToDict(resources){
        let dict = {};
        for(let i=0; i<resources.length; i++){
            let resource = resources[i];
            dict[resource.id] = resource;
        }
        return dict;
    }

    async loadGames(){
        let limit = 10;
        let offset = this.state.offset || 0;
        let games = await DataTableHelper.loadResourceFromServer("Games",offset,limit,[{field: "id",order: 0}]);
        let playerGamesOfGames = {};

        for(let i=0; i<games.length; i++){
            let game = games[i];
            let playergames = await DataTableHelper.loadResourceFromServer("PlayerGames",null,null,null, {GameId: game.id});
            playerGamesOfGames[game.id] = playergames;
        }

        this.setState({
            games: games,
            playerGamesOfGames: playerGamesOfGames,
        })
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

    async deleteGame(game){
        let answer = await ResourceHelper.handleRequestTypeOnResource(game,"Games",RequestHelper.REQUEST_TYPE_DELETE,{});
        if(RequestHelper.isSuccess(answer)){
            await this.loadGames();
        }
    }

    renderGame(game){
        let createdAt = new Date(game.createdAt);
        let year = createdAt.getFullYear();
        let month = createdAt.getMonth()+1;
        let day = createdAt.getDate();
        let hour = createdAt.getHours();
        let minute = createdAt.getMinutes();

        let title = hour+":"+minute+" - "+day+"."+month+"."+year;

        return (
            <div className="p-col-12">
                <Card title={title}>
                    <div className="p-grid p-dir-row">
                        <div className="p-col-6">
                            {this.renderGameInformations(game)}
                        </div>
                        <div className="p-col-6">
                            <Button className="p-button-danger" label="Löschen" icon="pi pi-trash" iconPos="right" onClick={this.deleteGame.bind(this,game)} />
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    renderGames(){
        let renderedGames = [];
        let games = this.state.games || [];
        for(let i=0; i<games.length; i++){
            let game = games[i];
            console.log("Render game: "+game.id);
            renderedGames.push(this.renderGame(game));
        }
        return renderedGames;
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
                    {this.renderGames()}
                </div>
            </div>
        </div>
    }
}