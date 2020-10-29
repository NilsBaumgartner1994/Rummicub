import React, {Component} from 'react';
import {Route, Link, Switch} from 'react-router-dom';
import {withRouter} from 'react-router';
import {AppMenu} from './AppMenu';
import classNames from 'classnames';
import 'babel-polyfill';
import './resources/style/primereact.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import 'prismjs/themes/prism-coy.css';
import './sass/App.scss';
import config from './config';

import {Growl} from "./components/growl/Growl";
import {DialogHelper} from "./helper/DialogHelper";
import {HomeComponent} from './screens/home/HomeComponent';
import {SupportComponent} from './screens/home/SupportComponent';
import {ResourceIndex} from "./screens/dataview/ResourceIndex";
import {ResourceInstance} from "./screens/dataview/ResourceInstance";
import {ResourceCreate} from "./screens/dataview/ResourceCreate";
import {RouteHelper} from "./sequelizeConnector/RouteHelper";
import {SequelizeConnector} from "./sequelizeConnector/SequelizeConnector";
import {Login} from "./screens/auth/Login";
import {APIRequest} from "./sequelizeConnector/APIRequest";
import {AuthConnector} from "./sequelizeConnector/AuthConnector";
import {MyStorage} from "./helper/MyStorage";
import {NewRound} from "./screens/dataviewCustomization/NewRound";
import {ListGames} from "./screens/dataviewCustomization/ListGames";
import {ListPlayers} from "./screens/dataviewCustomization/ListPlayers";


export class App extends Component {

    static dialog = null;
    static growl = null;

    static addToastMessage(summary, detail, severity="success",cloasable, sticky, life){
        if(App.growl && App.growl.show){
            App.growl.show({severity:severity, summary: summary, detail: detail, cloasable: cloasable, sticky: sticky, life: life});
        }
    }

    constructor() {
        super();
        this.state = {
            mobileMenuActive: false,
            themeMenuActive: false,
            themeMenuVisited: false,
            loading: true,
        };
        APIRequest.AppInstance = this;

        this.theme = 'luna-amber';
        this.changeTheme = this.changeTheme.bind(this);
        this.onMenuButtonClick = this.onMenuButtonClick.bind(this);
        this.onMenuButtonKeyDown = this.onMenuButtonKeyDown.bind(this);
        this.onSidebarClick = this.onSidebarClick.bind(this);
        this.onThemesLinkClick = this.onThemesLinkClick.bind(this);
        this.onThemesLinkKeyDown = this.onThemesLinkKeyDown.bind(this);
        this.onThemeChangerKeyDown = this.onThemeChangerKeyDown.bind(this);
        this.onThemesMenuRouteChange = this.onThemesMenuRouteChange.bind(this);

        this.loadInformations();
    }

    async loadInformations(){
        SequelizeConnector.reset();
        let loggedIn = await AuthConnector.isLoggedInUser();
        let schemes = await SequelizeConnector.getSchemes() || {};
        let tableNames = Object.keys(schemes);
        this.setState({
            tableNames: tableNames,
            schemes: schemes,
            loggedIn: loggedIn,
            loading: false,
        })
    }

    async setLoggedInState(loggedIn){
        if(loggedIn){
            await this.loadInformations();
        } else {
            await this.setState({
                loggedIn: loggedIn
            });
        }
    }

    renderCustomRoutes(){
        return [
            <Route exact path="/game/new" component={NewRound}/>,
            <Route exact path="/game/:id" component={NewRound}/>,
            <Route exact path="/games/" component={ListGames}/>,
            <Route exact path="/players/" component={ListPlayers}/>,
        ]
    }

    renderInstanceRoute(path, tableName){
        return <Route exact path={path} component={withRouter(ResourceInstance.bind(this,this.state.schemes,tableName))} />;
    }

    renderInstanceCreateRoute(path, tableName){
        return <Route exact path={path} component={withRouter(ResourceCreate.bind(this,this.state.schemes,tableName))} />;
    }

    renderIndexRoutes(){
        return <Route exact path={"/models/:tableName"} component={withRouter(ResourceIndex.bind(this,this.state.schemes))}/>;
    }

    renderDatabaseRoutes(){
        if(!!this.state.schemes && !!this.state.tableNames){
            let output = [];
            console.log("renderDatabaseRoutes: ");
            console.log(this.state.schemes);
            output.push(this.renderIndexRoutes());

            for(let i=0; i<this.state.tableNames.length; i++){
                let tableName = this.state.tableNames[i];
                let getRoute = RouteHelper.getInstanceRoute(this.state.schemes, tableName);
                let createRoute = RouteHelper.getCreateRouteForResource(this.state.schemes, tableName);

                output.push(this.renderInstanceRoute(getRoute,tableName));
                output.push(this.renderInstanceCreateRoute(createRoute,tableName));
            }

            return output;
        } else {
            return (<div></div>)
        }
    }

    changeTheme(event, theme, dark) {
        let themeElement = document.getElementById('theme-link');
        themeElement.setAttribute('href', themeElement.getAttribute('href').replace(this.theme, theme));
        this.theme = theme;

        if (dark) {
            if (!this.darkDemoStyle) {
                this.darkDemoStyle = document.createElement('style');
                this.darkDemoStyle.type = 'text/css';
                this.darkDemoStyle.innerHTML = '.implementation { background-color: #3f3f3f !important; color: #dedede !important} .implementation > h3, .implementation > h4{ color: #dedede !important}';
                document.body.appendChild(this.darkDemoStyle);
            }
        } else if (this.darkDemoStyle) {
            document.body.removeChild(this.darkDemoStyle);
            this.darkDemoStyle = null;
        }

        this.setState({
            themeMenuActive: false
        });
        this.unbindThemesMenuDocumentClickListener();
        event.preventDefault();
    }

    toggleMenu() {
        this.setState({
            mobileMenuActive: !this.state.mobileMenuActive
        }, () => {
            if (this.state.mobileMenuActive)
                this.bindMenuDocumentClickListener();
            else
                this.unbindMenuDocumentClickListener();
        });
    }

    onMenuButtonClick() {
        this.toggleMenu();
    }

    onMenuButtonKeyDown(event) {
        if (event.key === 'Enter') {
            this.toggleMenu();
        }
    }

    onSidebarClick(event) {
        if (event.target.nodeName === 'A') {
            this.setState({mobileMenuActive: false});
        }
    }

    onThemesLinkClick() {
        this.setState({
            themeMenuActive: !this.state.themeMenuActive,
            themeMenuVisited: true
        }, () => {
            if (this.state.themeMenuActive)
                this.bindThemesMenuDocumentClickListener();
            else
                this.unbindThemesMenuDocumentClickListener();
        });
    }

    onThemesLinkKeyDown(event) {
        if (event.key === 'Enter') {
            this.onThemesLinkClick();
        }
    }

    onThemeChangerKeyDown(event) {
        if (event.key === 'Enter') {
            event.target.click();
        }
    }

    onThemesMenuRouteChange() {
        this.setState({themeMenuActive: false}, () => {
            this.unbindThemesMenuDocumentClickListener();
        });
    }

    bindMenuDocumentClickListener() {
        if (!this.menuDocumentClickListener) {
            this.menuDocumentClickListener = (event) => {
                if (!this.isMenuButtonClicked(event) && !this.sidebar.contains(event.target)) {
                    this.setState({mobileMenuActive: false});
                    this.unbindMenuDocumentClickListener();
                }
            };

            document.addEventListener('click', this.menuDocumentClickListener);
        }
    }

    unbindMenuDocumentClickListener() {
        if (this.menuDocumentClickListener) {
            document.removeEventListener('click', this.menuDocumentClickListener);
            this.menuDocumentClickListener = null;
        }
    }

    isMenuButtonClicked(event) {
        return event.target === this.menuButton || this.menuButton.contains(event.target);
    }

    bindThemesMenuDocumentClickListener() {
        if (!this.themesMenuDocumentClickListener) {
            this.themesMenuDocumentClickListener = (event) => {
                if (this.themeMenu && event.target !== this.themeMenuLink && !this.themeMenu.contains(event.target)) {
                    this.setState({themeMenuActive: null});
                    this.unbindThemesMenuDocumentClickListener();
                }
            };

            document.addEventListener('click', this.themesMenuDocumentClickListener);
        }
    }

    unbindThemesMenuDocumentClickListener() {
        if (this.themesMenuDocumentClickListener) {
            document.removeEventListener('click', this.themesMenuDocumentClickListener);
            this.themesMenuDocumentClickListener = null;
        }
    }

    componentWillUnmount() {
        this.unbindThemesMenuDocumentClickListener();
        this.unbindMenuDocumentClickListener();
    }

    render() {
        if(this.state.loading){
            return null;
        }
        if(!this.state.loggedIn){
            return <Login/>
        }

        let currentUser = MyStorage.getCurrentUser();
        let displayName = "What ?";
        if(!!currentUser){
            displayName = currentUser.displayName;
        }

        return (
            <div className="layout-wrapper">
                <Growl ref={(el) => App.growl = el} />
                <DialogHelper ref={(el) => App.dialog = el} />
                <div className="layout-topbar">
                    <span ref={el => this.menuButton = el} className="menu-button" tabIndex="0"
                          onClick={this.onMenuButtonClick} onKeyDown={this.onMenuButtonKeyDown}>
                        <i className="pi pi-bars"/>
                    </span>
                    <Link to="/" className="logo" style={{"margin-left":"0px"}}>
                        <img alt="data" src="/showcase/resources/images/Banner.png" style={{width: "auto" ,height: 55}}/>
                    </Link>

                    <ul className="topbar-menu p-unselectable-text">
                        <li>
                            <Link to="/">{"Wer verliert heute?"}</Link>
                        </li>
                    </ul>
                </div>

                <div id="layout-sidebar" ref={el => this.sidebar = el}
                     className={classNames({'active': this.state.mobileMenuActive})} onClick={this.onSidebarClick}>
                    <AppMenu loggedIn={this.state.loggedIn}/>
                </div>

                <div className={classNames({'layout-mask': this.state.mobileMenuActive})}/>

                <div id="layout-content">
                    <Switch>
                        <Route exact path="/" component={HomeComponent}/>
                        <Route exact path="/support" component={SupportComponent}/>

                        {this.renderDatabaseRoutes()}
                        {this.renderCustomRoutes()}
                    </Switch>
                    <div className="content-section layout-footer clearfix">
                        <span>{config.title} {config.version}</span>
                    </div>
                </div>

            </div>
        );
    }
}

export default App;
