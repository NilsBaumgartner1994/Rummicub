import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import config from './../../config';
import {Button} from '../../components/button/Button';
import {WindowHelper} from "../../helper/WindowHelper";

const buttonSize = "100%"
const buttonStyle = {"font-size": "25px", width: buttonSize}

export class HomeComponent extends Component {

    openCreateNewGame(){
        WindowHelper.openUrl("/game/new");
    }

    openListGames(){
        WindowHelper.openUrl("/games/");
    }

    openPlayers(){
        WindowHelper.openUrl("/players/");
    }

    render() {
        return (
            <div className="home">
                <div className="introduction" >
                    <div className="p-grid" style={{paddingLeft: 0, paddingRight: 0}}>
                        <div className="p-col-12">
                            <div style={{"justify-content":"center", display:"flex"}}>
                                <Button style={buttonStyle} className="p-button-raised" label="Neues Spiel" icon="pi pi-plus" iconPos="right" onClick={() => {this.openCreateNewGame()}} />
                            </div>
                        </div>
                        <div className="p-col-12">
                            <div style={{width: "100%", "justify-content":"center", display:"flex"}}>
                                <Button style={buttonStyle} className="p-button-raised" label="Spieler" icon="pi pi-user" iconPos="right" onClick={() => {this.openPlayers()}} />
                            </div>
                        </div>
                        <div className="p-col-12">
                            <div style={{width: "100%", "justify-content":"center", display:"flex"}}>
                                <Button style={buttonStyle} className="p-button-raised" label="Spiele" icon="pi pi-list" iconPos="right" onClick={() => {this.openListGames()}} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
