import React, {Component} from 'react';
import classNames from 'classnames';
import {Link} from 'react-router-dom';
import {CSSTransition} from 'react-transition-group';
import {RequestHelper} from "./sequelizeConnector/RequestHelper";
import {StringHelper} from "./helper/StringHelper";
import {SequelizeConnector} from "./sequelizeConnector/SequelizeConnector";

export class AppMenu extends Component {

    static defaultDivStyle = {"textAlign":"left","wordBreak": "break-word"};

    constructor(props) {
        super(props);
        this.state = {
            activeMenu: -1,
            loading: true,
            advanced: false,
        };
        this.loadInformations();
    }

    toggleMenu(val) {
        let active = this.state.activeMenu === val;

        this.setState({activeMenu: active ? -1 : val});
    }

    async loadInformations(){
        let schemes = await SequelizeConnector.getSchemes();
        this.setState({
            tableNames: this.getTableNamesSingle(schemes),
            associationTables: this.getTableNamesAssociations(schemes),
            loading: false,
        })
    }

    filterAdvancedSchemes(schemes){

        return schemes;
    }

    getTableNamesSingle(schemes){
        let tableNames = [];
        if(schemes){
            let allTableNames = Object.keys(schemes);
            for(let i=0; i<allTableNames.length; i++){
                let tableName = allTableNames[i];
                let getRouteScheme = schemes[tableName]["GET"];
                let amountOfParams = StringHelper.occurrences(getRouteScheme,":");
                if(amountOfParams<=1){
                    tableNames.push(tableName);
                }
            }
        }
        return tableNames;
    }

    getTableNamesAssociations(schemes){
        let singleTableNames = this.getTableNamesSingle(schemes);
        let schemeCopy = JSON.parse(JSON.stringify(schemes));
        for(let i=0; i<singleTableNames.length; i++){
            let tableName = singleTableNames[i];
            delete schemeCopy[tableName];
        }
        let associationTableNames = Object.keys(schemeCopy) || [];
        return associationTableNames;
    }

    renderBulletLink(name,url){
        return(
            <Link style={AppMenu.defaultDivStyle} to={url}>&#9679;&nbsp;{name}</Link>
        )
    }

    renderSchemesSingle(){
        return this.renderSchemes(this.state.tableNames);
    }

    renderSchemesAssociations(){
        return this.renderSchemes(this.state.associationTables);
    }

    renderSchemes(tableNames = []){
        let linkList = [];
        for(let i=0; i<tableNames.length; i++){
            let tableName = tableNames[i];
            linkList.push(this.renderBulletLink(tableName,'/models/'+tableName));
        }

        return <div>{linkList}</div>;
    }

    renderSidebarMenu(index, title, iconName, content){
        return (
                [<button key={"renderSidebarMenu-"+index} id="data_menutitle" onClick={() => this.toggleMenu(index)}
                         className={classNames({'active-menuitem': this.state.activeMenu === index})}>
                    <img alt="data" className="layout-menu-icon-inactive"
                         src={"/showcase/resources/images/mono/"+iconName+".svg"}/>
                    <img alt="data" className="layout-menu-icon-active"
                         src={"/showcase/resources/images/mono/"+iconName+"-active.svg"}/>
                    <span>{title}</span>
                </button>,
                    <CSSTransition classNames="layout-submenu" timeout={{enter: 400, exit: 400}}
                                   in={this.state.activeMenu === index}>
                        <div className="layout-submenu">
                            {content}
                        </div>
                    </CSSTransition>
                ]
        )
    }

    renderSidebarListOfBulletLinks(mapNameURL){
        let links = [];
        let names = Object.keys(mapNameURL);
        for(let i=0; i<names.length; i++){
            let name = names[i];
            let url = mapNameURL[name];
            links.push(this.renderBulletLink(name,url));
        }

        return(
            <div>
                {links}
            </div>
        )
    }

    render() {
        let sidebarGame = this.renderSidebarListOfBulletLinks({"Neue Runde": "/game/newRound", "Neue Runde 2": "/game/newRound"});

        let index = 0;

        return (
            <div className="layout-menu">

                {this.renderSidebarMenu(index++,"Spiel","file",sidebarGame)}
                {this.renderSidebarMenu(index++,"Tables","data",this.renderSchemesSingle())}
                {this.renderSidebarMenu(index++,"Associations","data",this.renderSchemesAssociations())}
                {this.renderSidebarMenu(index++,"Statistics","charts",null)}
                {this.renderSidebarMenu(index++,"Server Information","data",null)}

            </div>
        );
    }
}
