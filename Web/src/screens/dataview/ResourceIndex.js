import React, {Component} from 'react';
import {DefaultResourceDatatable} from "./DefaultResourceDatatable";
import {Button} from "../../components/button/Button";
import {RouteHelper} from "../../sequelizeConnector/RouteHelper";
import {WindowHelper} from "../../helper/WindowHelper";
import {Dialog} from "../../components/dialog/Dialog";
import {RequestHelper} from "../../sequelizeConnector/RequestHelper";
import {SequelizeConnector} from "../../sequelizeConnector/SequelizeConnector";
import {APIRequest} from "../../sequelizeConnector/APIRequest";
import App from "../../App";

export class ResourceIndex extends Component {

    static DIALOG_DELETE = "dialogDelete";

    constructor(schemes) {
        super();
        console.log("")
        this.state = {
            schemes: schemes,
            ownSelectedResources: [],
            visibleDialogDeleteUser: false,
            reloadNumber: 0,
            tableName: null,
            isLoading: true
        };
    }

    onSelectionChange(ownSelectedResources){
        this.setState({
            ownSelectedResources: ownSelectedResources
        })
    }

    async componentDidMount() {
        console.log("ResourceIndex: componentDidMount");
        const { match: { params } } = this.props;
        console.log(params);
        let tableName = params.tableName;
        let scheme = await SequelizeConnector.getScheme(tableName);
        let routes = await SequelizeConnector.getSchemeRoutes(tableName);
        this.setState({
            tableName: tableName,
            isLoading: false,
            scheme: scheme,
            routes: routes
        });
    }

    openCreateResource(){
        let route = RouteHelper.getCreateRouteForResource(this.state.schemes,this.state.tableName);
        WindowHelper.openUrl(route);
    }

    getCreateItem(){
        const item=
            {
                label:'New',
                icon:'pi pi-plus',
                command: this.openCreateResource.bind(this)
            };

        return item;
    }

    getDeleteItems(){
        let ownSelectedResources = this.state.ownSelectedResources;
        let amount = ownSelectedResources.length;
        let disabled = amount <= 0;

        const item=
            {
                disabled: disabled,
                label:'Delete ('+amount+")",
                icon:'pi pi-minus',
                command: () => {this.setDialogVisible(ResourceIndex.DIALOG_DELETE,true)}
            };

        return item;
    }


    getMenuItems(){
        const items=[
            this.getCreateItem(),
            this.getDeleteItems()
        ];
        return items;
    }

    async handleImportResource(resources){
        let tableName = this.state.tableName;
        let route = await RouteHelper.getIndexRouteForResourceAsync(tableName);
        let amountSuccess = 0;
        let amountResources = 0;
        if(resources){
            amountResources = resources.length;
            for(let i=0; i<amountResources; i++){
                let resource = resources[i];
                let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_POST,route,resource);
                if(RequestHelper.isSuccess(answer)){
                    amountSuccess++;
                }
            }
        }
        let amountErrors = amountResources-amountSuccess;
        if(amountSuccess>0){
            App.addToastMessage("Success",amountSuccess+" "+tableName+" created");
        }
        if(amountErrors>0){
            App.addToastMessage("Error ",amountErrors+" "+tableName+" not created","error");
        }
        this.setState({
            reloadNumber: this.state.reloadNumber+1,
        });
    }

    async deleteResources(){
        let ownSelectedResources = this.state.ownSelectedResources;
        let tableName = this.state.tableName;
        let amountSuccess = 0;
        let amountResources = 0;
        if(ownSelectedResources){
            amountResources = ownSelectedResources.length;
            for(let i=0; i<amountResources; i++){
                let resource = ownSelectedResources[i];
                let route = RouteHelper.getInstanceRouteForResource(this.state.schemes,this.state.scheme,tableName,resource);
                let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_DELETE,route);
                if(RequestHelper.isSuccess(answer)){
                    amountSuccess++;
                }
            }
        }
        let amountErrors = amountResources-amountSuccess;

        await this.setDialogVisible(ResourceIndex.DIALOG_DELETE,false)
        if(amountSuccess>0){
            App.addToastMessage("Success",amountSuccess+" "+tableName+" deleted");
        }
        if(amountErrors>0){
            App.addToastMessage("Error ",amountErrors+" "+tableName+" not deleted","error");
        }
        this.setState({
            reloadNumber: this.state.reloadNumber+1,
            ownSelectedResources: []
        });
    }

    async setDialogVisible(dialogID, visible){
        await this.setState({
            [dialogID]: visible
        })
    }

    renderDialogDeleteResources(){
        const footer = (
            <div>
                <Button label="Yes" icon="pi pi-check" className="p-button-danger p-button-raised" onClick={() => {this.deleteResources(); }} />
                <Button label="No" icon="pi pi-times" className="p-button-info p-button-raised" onClick={() => {this.setDialogVisible(ResourceIndex.DIALOG_DELETE, false)}} className="p-button-secondary" />
            </div>
        );

        let tableName = this.state.tableName;

        return(
            <Dialog header={"Delete "+tableName} visible={this.state[ResourceIndex.DIALOG_DELETE]} style={{width: '50vw'}} footer={footer} modal={true} onHide={() => this.setDialogVisible(ResourceIndex.DIALOG_DELETE, false)}>
                <div>Are you sure you want to delete this {tableName} ? This cannot be undone.</div>
            </Dialog>
        );
    }

    render() {
        if(this.state.isLoading){
            return <div></div>
        }
        return <div>
            {this.renderDialogDeleteResources()}
            <DefaultResourceDatatable
                onHandleImport={this.handleImportResource.bind(this)}
                key={this.state.reloadNumber}
                onSelectionChange={this.onSelectionChange.bind(this)}
                schemes={this.state.schemes}
                tableName={this.state.tableName}
                menuItems={this.getMenuItems()} />
        </div>
    }
}
