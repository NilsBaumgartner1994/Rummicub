import React, {Component} from 'react';
import queryString from 'query-string';
import {ProgressSpinner} from '../../components/progressspinner/ProgressSpinner';
import {Card} from '../../components/card/Card';
import {Growl} from '../../components/growl/Growl';
import {ProgressBar} from '../../components/progressbar/ProgressBar';
import {RequestHelper} from "../../sequelizeConnector/RequestHelper";
import {SchemeHelper} from "../../sequelizeConnector/SchemeHelper";
import {Button} from '../../components/button/Button';
import {Calendar} from '../../components/calendar/Calendar';
import {InputText} from '../../components/inputtext/InputText';
import {InputTextarea} from '../../components/inputtextarea/InputTextarea';
import {Dialog} from '../../components/dialog/Dialog';
import {RouteHelper} from "../../sequelizeConnector/RouteHelper";
import { OverlayPanel } from '../../components/overlaypanel/OverlayPanel';
import {AssociationIndexOverlay} from "./AssociationIndexOverlay";

import {SequelizeConnector} from "../../sequelizeConnector/SequelizeConnector";
import {HeaderTemplate} from "../../templates/HeaderTemplate";
import {Customization} from "../dataviewCustomization/Customization";
import {Editor} from "../../components/editor/Editor";
import {APIRequest} from "../../sequelizeConnector/APIRequest";
import {TabMenu} from "../../components/tabmenu/TabMenu";
import App from "../../App";
import {ResourceAssociationHelper} from "../../sequelizeConnector/ResourceAssociationHelper";
import {SelectButton} from "../../components/selectbutton/SelectButton";
import {MyImageUploader} from "../../helper/MyImageUploader";
import {Lightbox} from "../../components/lightbox/Lightbox";

export class ResourceInstance extends Component {

    constructor(schemes,tableName) {
        super();
        this.state = {
            schemes: schemes,
            tableName: tableName,
            isLoading: true,
            isEdited: false,
            jsonEditorsVisible: {},
            jsonEditorsValues: {},
            dialogs: {},
            requestPending: false,
            visibleDialogDeleteResource: false,
            increasingNumber: 0,
        };
    }

    async componentDidMount() {
		const { match: { params } } = this.props;
		this.params = params;
		console.log(params);
        await this.loadResources(params);
    }

    async reloadPage(){
        await this.loadResources(this.params);
    }

    async loadResources(params){
        let route = RouteHelper.getInstanceRouteForParams(this.state.schemes,this.state.tableName,params);
        let resource = null;
        let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_GET,route);
        if(RequestHelper.isSuccess(answer)){
            resource = answer.data;

        }
        let scheme = await SequelizeConnector.getScheme(this.state.tableName);
        let associations = await SequelizeConnector.getSchemeAssociations(this.state.tableName);
        let associationResources = await this.loadAssociationResources(route,associations);
        let associationSchemes = await this.loadAssociationSchemes(associations);

        console.log("resource");
        console.log(resource);
        console.log("associationResources");
        console.log(associationResources);

        this.setState({
            isLoading: false,
            resource: resource,
            resourceCopy: JSON.parse(JSON.stringify(resource)),
            associations: associations,
            associationResources: associationResources,
            associationSchemes: associationSchemes,
            route: route,
            scheme: scheme,
            params: params,
            increasingNumber: this.state.increasingNumber+1
        });
    }

    async loadAssociationSchemes(associations){
        let associationSchemes = {};

        let associationTableNames = Object.keys(associations);
        for(let i=0; i<associationTableNames.length; i++){
            let key = associationTableNames[i];
            let associationTableName = associations[key]["target"];
            let scheme = await SequelizeConnector.getScheme(associationTableName);
            associationSchemes[associationTableName] = scheme;
        }
        return associationSchemes;
    }

    async loadAssociationResources(route,associations){
        let associationResources = {};

        let associationTableNames = Object.keys(associations);
        for(let i=0; i<associationTableNames.length; i++){
            let key = associationTableNames[i];
            let associationName = associations[key]["associationName"];
            let answer = await this.loadAssociation(route,associationName);
            if(!!answer && !answer.error){
                associationResources[associationName] = answer;
            } else {
                associationResources[associationName] = null;
            }
        }
        return associationResources;
    }

    async loadAssociation(route,associationName){
        route = route+"/associations/"+associationName;
        let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_GET,route);
        if(RequestHelper.isSuccess(answer)){
            return answer.data;
        } else {
            return null;
        }
    }

    async updateResource(){
        let resource = this.state.resource;
        let payloadJSON = resource;
        let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_PUT,this.state.route,payloadJSON);
        if(!RequestHelper.isSuccess(answer)){
            this.setState({
                requestPending: false,
            });
            let detail = !answer ? 'Unkown error!' : answer.error;
            App.addToastMessage("Error",detail,"error");
        } else {
            this.setState({
                resource: answer.data,
                resourceCopy: answer.data,
                isEdited: false,
                requestPending: false,
            });
            App.addToastMessage("Success","Changes saved");
        }
    }

    renderDataCard(){
        return(
            <div className="p-col-12">
                <Card title={"Data"}>
                    {this.renderDataFields()}
                    {this.renderUpdateButton()}
                    {this.renderResetButton()}
                    {this.renderRequestPendingBar()}
                </Card>
            </div>
        )
    }

    resetResource(){
        this.setState({
            resource: JSON.parse(JSON.stringify(this.state.resourceCopy)),
            isEdited: false,
            jsonEditorsVisible: {},
            jsonEditorsValues: {},
        });
    }

    unsavedContentExist(){
        return this.state.isEdited && !this.state.requestPending;
    }

    renderResetButton(){
        if(this.unsavedContentExist()){
            return(<Button style={{"margin-right":"1em"}} className="p-button-raised" label="Reset" icon="pi pi-undo" onClick={() => {this.resetResource()}} />);
        } else {
            return(<Button style={{"margin-right":"1em"}} className="p-button-raised" label="Reset" icon="pi pi-undo" disabled={true} />);
        }
    }

    renderUpdateButton(){
        if(this.unsavedContentExist()){
            return(<Button style={{"margin-right":"1em"}} className="p-button-raised" label="Save" icon="pi pi-check" onClick={() => {this.updateResource()}} />);
        } else {
            return(<Button style={{"margin-right":"1em"}} className="p-button-raised" label="Save" icon="pi pi-check" disabled={true} />);
        }
    }

    renderRequestPendingBar(){
        if(this.state.requestPending){
            return(<ProgressBar mode="indeterminate" style={{height: '6px'}}></ProgressBar>);
        }
        return (null);
    }

    renderDataFields(){
        let output = [];
        let attributeKeys = SchemeHelper.getAttributeKeys(this.state.scheme);
        for(let i=0; i<attributeKeys.length; i++){
            let attributeKey = attributeKeys[i];
            if(!SchemeHelper.isReferenceField(this.state.scheme, attributeKey)){
                let isEditable = SchemeHelper.isEditable(this.state.scheme, attributeKey);
                output.push(this.renderDataField(attributeKey,isEditable));
            }
        }
        return output;
    }

    renderDataField(attributeKey,isEditable){
        let valueField = this.state.resource[attributeKey];
        if(isEditable){
            valueField = this.renderEditableField(attributeKey);
        }

        let isAllowedNull = SchemeHelper.isAllowedNull(this.state.scheme, attributeKey);
        let starField = isAllowedNull ? "" : <i className="pi pi-star" style={{'fontSize': '0.7em',"margin-right":"0.5em", "vertical-align": "super","color":"red"}}></i>
        let attributeKeyRow = <div>{starField}{attributeKey}</div>

        return(
            <div className="p-grid">
                <div className="p-col-3" >{attributeKeyRow}</div>
                <div className="p-col-9" >{valueField}</div>
            </div>
        )
    }

    renderEditableField(attributeKey){
        let attributeType = SchemeHelper.getType(this.state.scheme,attributeKey);
        switch(attributeType){
            case "TEXT": return this.renderEditorField(attributeKey);
            case "STRING": return this.renderEditableTextField(attributeKey);
            case "BOOLEAN": return this.renderEditableBooleanField(attributeKey);
            case "INTEGER": return this.renderEditableIntegerField(attributeKey);
            case "DATE": return this.renderEditableDateField(attributeKey);
            case "JSON": return this.renderEditableJSONField(attributeKey);
        }
        if(this.state.tableName==="Images"){
            if(attributeType==="BLOB"){
                return this.renderImageBlobField(attributeKey);
            }
        }

        return <div style={{"background-color": "green"}}>{this.state.resource[attributeKey]}</div>;
    }

    handleUpload(attributeKey, file){
        var reader = new FileReader();

        var senddata = new Object();
        // Auslesen der Datei-Metadaten
        senddata.name = file.name;
        senddata.date = file.lastModified;
        senddata.size = file.size;
        senddata.type = file.type;
        let instance = this;

        reader.addEventListener("load", function () {
            let data = reader.result;
            console.log(data);
            instance.handleSaveEditedRawValue(attributeKey,data);
        }, false);
        reader.readAsBinaryString(file);


    }

    toBase64(arr) {
        //arr = new Uint8Array(arr) if it's an ArrayBuffer
        return btoa(
            arr.reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
    }

    renderImageBlobField(attributeKey){
        console.log("renderBlobField");
        console.log(this.state.resource[attributeKey]);
        let blob = this.state.resource[attributeKey];
        console.log(blob);
        let base64 = this.toBase64(blob.data);
        console.log("Base64");
        console.log(base64);

        return(
            <div>
                <div className="p-inputgroup">
                    <img src={"data:image/png;base64, "+base64+"="} />
                    <MyImageUploader handleUpload={this.handleUpload.bind(this,attributeKey)} tableName={this.props.tableName} />
                </div>
            </div>
        );
    }

    renderEditorField(attributeKey){
        let maxLength = SchemeHelper.getTypeStringMaxLength(this.state.scheme,attributeKey);
        let resourceValue = this.state.resource[attributeKey] || "";

        const header = (
            <span className="ql-formats">
                <button className="ql-bold" aria-label="Bold"></button>
                <button className="ql-italic" aria-label="Italic"></button>
                <button className="ql-underline" aria-label="Underline"></button>
                <button className="ql-image" aria-label="Image"></button>
                <button className="ql-code-block" aria-label="Code"></button>
            </span>
        );

        return(
            <div>
                <Editor headerTemplate={header} style={{height:'150px'}} id="float-input" type="text" value={resourceValue} onTextChange={(e) =>{ console.log(e); this.handleSaveEditedRawValue(attributeKey,e.htmlValue)}} />
                <div>{this.state.resource[attributeKey]}</div>
                <div className="p-inputgroup">
                    {this.renderClearValueButton(attributeKey)}
                </div>

            </div>
        );
    }

    renderEditableTextField(attributeKey){
        let maxLength = SchemeHelper.getTypeStringMaxLength(this.state.scheme,attributeKey);
        let resourceValue = this.state.resource[attributeKey] || "";
        let remeiningChars = maxLength-resourceValue.length;
        let cols = 30;
        let rows = resourceValue.length/cols;
        rows = rows > 10 ? 10 : rows;

        return(
            <div>
                <div className="p-inputgroup">
                    <InputTextarea rows={rows} cols={cols} id="float-input" maxLength={maxLength} type="text" size="30" value={resourceValue} onChange={this.handleSaveEditedValue.bind(this,attributeKey)} />
                    {this.renderClearValueButton(attributeKey)}
                </div>
                <div style={{"fontSize": "12px", "font-style": "italic"}}>{remeiningChars} characters remeining</div>
            </div>
        );
    }

    renderEditableBooleanField(attributeKey){
        let resourceValue = this.state.resource[attributeKey];
        const selectItems = [
            {label: 'Yes', value: true},
            {label: 'No', value: false},
            {label: 'Null', value: null},
        ];

        return(
            <div className="p-inputgroup">
                <SelectButton value={resourceValue} options={selectItems} onChange={this.handleSaveEditedValue.bind(this,attributeKey)} />
            </div>
        );
    }

    renderEditableIntegerField(attributeKey){
        let resourceValue = this.state.resource[attributeKey] || "";

        return(
            <div className="p-inputgroup">
                <InputText id="float-input" keyfilter={"int"} type="text" size="30" value={resourceValue} onChange={this.handleSaveEditedValue.bind(this,attributeKey)} />
                {this.renderClearValueButton(attributeKey)}
            </div>
        );
    }

    handleSaveEditedValue(attributeKey, event){
        this.handleSaveEditedRawValue(attributeKey,event.target.value);
    }

    handleSaveEditedRawValue(attributeKey, value){
        this.state.resource[attributeKey] = value ;
        this.saveResourceChange();
    }

    renderClearValueButton(attributeKey){
        return <Button icon="pi pi-times" className="p-button-danger" onClick={this.handleClearValue.bind(this,attributeKey)} />;
    }

    handleClearValue(attributeKey){
        this.state.resource[attributeKey] = null;
        this.saveResourceChange();
    }

    renderEditableJSONField(attributeKey){
        let resourceValue = JSON.stringify(this.state.resource[attributeKey]);
        if(!this.state.jsonEditorsValues[attributeKey]){
            this.state.jsonEditorsValues[attributeKey] = resourceValue;
        }

        const onAbort = (e) => {
            let editorState = this.state.jsonEditorsVisible;
            editorState[attributeKey] = false;
            let editorValues = this.state.jsonEditorsValues;
            editorValues[attributeKey] = resourceValue;
            this.setState({
                jsonEditorsVisible: editorState,
                jsonEditorsValues: editorValues
            });
        };

        const onShow = (e) => {
            let editorState = this.state.jsonEditorsVisible;
            editorState[attributeKey] = true;
            this.setState({
                jsonEditorsVisible: editorState
            });
        };

        const onValidate = (e) => {
            try{
                let json = JSON.parse(this.state.jsonEditorsValues[attributeKey]);
                let resource = this.state.resource;
                resource[attributeKey] = json;

                let editorValues = this.state.jsonEditorsValues;
                editorValues[attributeKey] = JSON.stringify(json);

                let editorState = this.state.jsonEditorsVisible;
                editorState[attributeKey] = false;

                this.setState({
                    resource: resource,
                    jsonEditorsVisible: editorState,
                    jsonEditorsValues: editorValues
                });
            } catch(err){
                console.log("JSON Validation Error");
                console.log(err);
            }
        }

        let isValid = true;
        try{
            JSON.parse(this.state.jsonEditorsValues[attributeKey]);
        } catch(err){
            isValid = false;
        }

        let finishButton = <Button label="Finish" icon="pi pi-check" onClick={onValidate} />
        if(!isValid){
            finishButton = <Button label="Invalid JSON" className="p-button-danger" />;
        }

        const footer = (
            <div>
                {finishButton}
                <Button label="Abort" icon="pi pi-times" className="p-button-danger" onClick={onAbort} />
            </div>
        );

        return(
            <div>
            <div className="p-inputgroup">
                <InputTextarea id="float-input" autoResize={true} rows={5} cols={29} onClick={onShow} value={resourceValue} />
                <Button icon="pi pi-times" className="p-button-danger" onClick={() => {this.state.resource[attributeKey] = null; this.saveResourceChange()}} />
            </div>
                <Dialog header={"JSON Editor: "+attributeKey} footer={footer} visible={this.state.jsonEditorsVisible[attributeKey]} modal={true} onHide={onAbort}>
                    <InputTextarea id="float-input" autoResize={true} rows={20} cols={80} value={this.state.jsonEditorsValues[attributeKey]} onChange={(e) => {this.state.jsonEditorsValues[attributeKey] = e.target.value ;this.saveResourceChange()}}/>
                </Dialog>
            </div>
        );
    }

    renderEditableDateField(attributeKey){
        let resourceValue = this.state.resource[attributeKey];
        let value = !!resourceValue ? new Date(resourceValue) : null;

        return(
            <div className="p-inputgroup">
                <Calendar value={value} showTime={true} showSeconds={true} monthNavigator={true} touchUI={true} yearNavigator={true} yearRange="1990:2030" showButtonBar={true} onChange={(e) => {this.state.resource[attributeKey] = e.target.value ;this.saveResourceChange()}} />
                <Button icon="pi pi-times" className="p-button-danger" onClick={() => {this.state.resource[attributeKey] = null; this.saveResourceChange()}} />
            </div>
        );
    }

    saveResourceChange(){
        this.setState({
            resource: this.state.resource,
            isEdited: true
        });
    }


    renderAssociationCards(){
        let associationTableNames = Object.keys(this.state.associations);
        let output = [];
        for(let i=0; i<associationTableNames.length; i++){
            let key = associationTableNames[i];
            let associationName = this.state.associations[key]["associationName"];
            let associationTableName = this.state.associations[key]["target"];
            output.push(this.renderAssociationCard(associationTableName,associationName));
        }

        return output;
    }

    renderAssociationCard(associationTableName,associationName){
        if(associationTableName==="Images"){
            return this.renderAssociationCardImage(associationTableName,associationName);
        }
        let isPlural = associationTableName === associationName;
        return isPlural ? this.renderAssociationCardPlural(associationTableName,associationName) : this.renderAssociationCardSingle(associationTableName,associationName);
    }

    renderAssociationCardImage(associationTableName,associationName){
        return(
            <div className="p-col-12">
                <Card title={associationName}>
                    <MyImageUploader resource={this.state.resource} tableName={this.state.tableName} />
                </Card>
            </div>
        )
    }

    renderAssociationCardPlural(associationTableName,associationName){
        let associatedResources = this.state.associationResources[associationName];
        let modelscheme = this.state.associationSchemes[associationTableName];

        let amount = 0;
        if(!!associatedResources){
            amount = associatedResources.length;
        }
        let amountText = "("+amount+")";

        let overlaypanelID = "overlayPanel-"+associationName;
        let overlaypanelIDView = overlaypanelID+"View";
        let overlaypanelIDAddNew = overlaypanelID+"AddNew";
        let overlaypanelIDRemove = overlaypanelID+"Remove";

        let addCallbackFunction = this.handleAddAssociationsMultiple.bind(this,overlaypanelIDAddNew,associationTableName,associationName);
        let removeCallbackFunction = this.handleRemoveAssociationsMultiple.bind(this,overlaypanelIDRemove,associationTableName,associationName);

        let noAssociations = amount===0;

        return(
            <div className="p-col-12">
                <Card title={associationName+" "+amountText}>
                    <OverlayPanel style={AssociationIndexOverlay.defaultStyle} showCloseIcon={true} ref={(el) => this[overlaypanelIDView] = el}>
                        <AssociationIndexOverlay key={overlaypanelIDView+this.state.increasingNumber} tableType={AssociationIndexOverlay.TABLETYPE_View} showOnlyAssociated={true} tableName={associationTableName} scheme={modelscheme} associatedResources={associatedResources}></AssociationIndexOverlay>
                    </OverlayPanel>
                    <OverlayPanel style={AssociationIndexOverlay.defaultStyle}  showCloseIcon={true} ref={(el) => this[overlaypanelIDAddNew] = el}>
                        <AssociationIndexOverlay key={overlaypanelIDAddNew+this.state.increasingNumber} tableType={AssociationIndexOverlay.TABLETYPE_ADD_MULTIPLE} callbackFunction={addCallbackFunction} tableName={associationTableName} scheme={modelscheme} associatedResources={associatedResources} ></AssociationIndexOverlay>
                    </OverlayPanel>
                    <OverlayPanel style={AssociationIndexOverlay.defaultStyle}  showCloseIcon={true} ref={(el) => this[overlaypanelIDRemove] = el}>
                        <AssociationIndexOverlay key={overlaypanelIDRemove+this.state.increasingNumber} tableType={AssociationIndexOverlay.TABLETYPE_REMOVE_MULTIPLE} callbackFunction={removeCallbackFunction} tableName={associationTableName} scheme={modelscheme} associatedResources={associatedResources}></AssociationIndexOverlay>
                    </OverlayPanel>

                    <Button style={{"margin-right":"1em"}} disabled={noAssociations} type="button" icon="pi pi-search" label="View" onClick={(e) => this[overlaypanelIDView].toggle(e)} />
                    <Button style={{"margin-right":"1em"}} type="button" icon="pi pi-plus" className="p-button-success" label="Add" onClick={(e) => this[overlaypanelIDAddNew].toggle(e)} />
                    <Button style={{"margin-right":"1em"}} disabled={noAssociations} type="button" icon="pi pi-minus" className="p-button-danger" label="Remove" onClick={(e) => this[overlaypanelIDRemove].toggle(e)} />

                </Card>
            </div>
        )
    }

    async handleAddAssociationsMultiple(overlaypanelID,associationTableName,associationName,associationResources){
        let responseJSON = await ResourceAssociationHelper.handleRequestTypeOnMultiplePluralAssociation(
            this.state.resource,
            this.state.tableName,
            associationTableName,
            associationName,
            associationResources,
            RequestHelper.REQUEST_TYPE_POST
        )

        let amountSuccess = responseJSON.success.length;
        let amountErrors = responseJSON.errors.length;
        if(amountSuccess>0){
            App.addToastMessage("Success",amountSuccess+" "+associationName+" added");
        }
        if(amountErrors>0){
            App.addToastMessage("Error ",amountErrors+" "+associationName+" not added","error");
        }

        this[overlaypanelID].hide();
        this.reloadPage();
    }

    async handleRemoveAssociationsMultiple(overlaypanelID,associationTableName,associationName,associationResources){
        let responseJSON = await ResourceAssociationHelper.handleRequestTypeOnMultiplePluralAssociation(
            this.state.resource,
            this.state.tableName,
            associationTableName,
            associationName,
            associationResources,
            RequestHelper.REQUEST_TYPE_DELETE
        );

        let amountSuccess = responseJSON.success.length;
        let amountErrors = responseJSON.errors.length;

        if(amountSuccess>0){
            App.addToastMessage("Success",amountSuccess+" "+associationName+" removed");
        }
        if(amountErrors>0){
            App.addToastMessage("Error ",amountErrors+" "+associationName+" not added","error");
        }

        this[overlaypanelID].hide();
        this.reloadPage();
    }

    async handleRequestTypeOnMultipleAssociation(associationTableName,associationName,associationResource,requestType){
        return await ResourceAssociationHelper.handleRequestTypeOnPluralAssociation(this.state.resource,this.state.tableName,associationTableName,associationName,associationResource,requestType);
    }

    renderAssociationCardSingle(associationTableName,associationName){
        let resource = this.state.associationResources[associationName];
        let modelscheme = this.state.associationSchemes[associationTableName];
        let amountText = "";

        let isAssociated = !!resource;
        let associatedResources = [];
        if(isAssociated){
            associatedResources = [resource];
        }

        let overlaypanelID = "overlayPanel-"+associationName;
        let overlaypanelIDAddNew = overlaypanelID+"AddNew";
        let overlaypanelIDView = overlaypanelID+"View";

        let addCallbackFunction = this.handleSetAssociationsSingle.bind(this,overlaypanelIDAddNew,associationTableName,associationName);
        let removeCallbackFunction = this.handleRemoveAssociationsSingle.bind(this,associationTableName,associationName);

        return(
            <div className="p-col-12">
                <Card title={associationName}>
                    <OverlayPanel style={{"margin-right":"0.769em"}} showCloseIcon={true} ref={(el) => this[overlaypanelIDView] = el}>
                        <AssociationIndexOverlay key={overlaypanelIDView+this.state.increasingNumber} tableType={AssociationIndexOverlay.TABLETYPE_View} headerText={"Associated "+associationTableName} tableName={associationTableName} associatedResources={associatedResources}></AssociationIndexOverlay>
                    </OverlayPanel>
                    <OverlayPanel style={{"margin-right":"0.769em"}} showCloseIcon={true} ref={(el) => this[overlaypanelIDAddNew] = el}>
                        <AssociationIndexOverlay key={overlaypanelIDAddNew+this.state.increasingNumber} tableType={AssociationIndexOverlay.TABLETYPE_SET_SINGLE} callbackFunction={addCallbackFunction} tableName={associationTableName} associatedResources={associatedResources}></AssociationIndexOverlay>
                    </OverlayPanel>

                    <Button style={{"margin-right":"1em"}} disabled={!isAssociated} type="button" icon="pi pi-search" label="View" onClick={(e) => this[overlaypanelIDView].toggle(e)} />
                    <Button style={{"margin-right":"1em"}} disabled={isAssociated} className="p-button-success" type="button" icon="pi pi-plus" label="Set" onClick={(e) => this[overlaypanelIDAddNew].toggle(e)} />
                    <Button style={{"margin-right":"1em"}} disabled={!isAssociated} className="p-button-danger" type="button" icon="pi pi-minus" label="Remove" onClick={(e) => removeCallbackFunction()} />

                </Card>
            </div>
        )
    }

    async handleSetAssociationsSingle(overlaypanelID,associationTableName,associationName,associationResources){
        let associationModelscheme = this.state.associationSchemes[associationTableName];
        if(!!associationResources && associationResources.length===1){
            let associationResource = associationResources[0];
            let route = RouteHelper.getInstanceRouteForAssociatedResource(this.state.schemes,this.state.scheme,this.state.tableName,this.state.resource,associationModelscheme,associationTableName,associationName,associationResource);
            let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_POST,route);
            if(RequestHelper.isSuccess(answer)){
                App.addToastMessage("Success",associationName+" added");
                this[overlaypanelID].hide();
                this.reloadPage();
            }
        } else {
            App.addToastMessage("Error",associationName+" not added","error");
        }
    }

    async handleRemoveAssociationsSingle(associationTableName,associationName){
        let route = RouteHelper.getIndexRouteForAssociation(this.state.schemes,this.state.scheme,this.state.tableName,this.state.resource,associationName);
        let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_DELETE,route);

        if(RequestHelper.isSuccess(answer)){
            App.addToastMessage("Success",associationName+" removed");
            this.reloadPage();
        } else {
            App.addToastMessage("Error",associationName+" not removed","error");
        }
    }


    setDialogVisibility(associationTableName,visible){
        let dialogs = this.state.dialogs;
        dialogs[associationTableName] = visible;
        this.setState({dialogs: dialogs});
    }

    openDialogDeleteResource(){
        this.setState({visibleDialogDeleteResource: true});
    }

    async deleteResource(){
        let route = this.state.route;
        let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_DELETE,route);
        if(RequestHelper.isSuccess(answer)){
            this.props.history.push('/models/'+ this.state.tableName);
        }
    }

    renderDialogDeleteResource(){
        const footer = (
            <div>
                <Button label="Yes" icon="pi pi-check" className="p-button-danger p-button-raised" onClick={() => {this.setState({visibleDialogDeleteUser: false}); this.deleteResource(); }} />
                <Button label="No" icon="pi pi-times" className="p-button-info p-button-raised" onClick={() => {this.setState({visibleDialogDeleteUser: false}); }} className="p-button-secondary" />
            </div>
        );

        let tableNameSingle = this.state.tableName.slice(0,-1);

        return(
            <Dialog header={"Delete "+tableNameSingle} visible={this.state.visibleDialogDeleteResource} style={{width: '50vw'}} footer={footer} modal={true} onHide={() => this.setState({visibleDialogDeleteResource: false})}>
                <div>Are you sure you want to delete this {tableNameSingle} ? This cannot be undone.</div>
            </Dialog>
        );
    }

    renderDangerZone(){
        let tableNameSingle = this.state.tableName.slice(0,-1);

        return(
            <div className="p-col-12">
                <Card title={"Danger Zone"} >
                    <Button label={"Delete "+tableNameSingle} icon="pi pi-times" className="p-button-danger p-button-raised" onClick={() => this.openDialogDeleteResource()} />
                </Card>
                {this.renderDialogDeleteResource()}
            </div>
        )
    }

    renderHeader(){
        let tableNameSingle = this.state.tableName.slice(0,-1);
        return <HeaderTemplate title={tableNameSingle} subtitle={"All informations"} />
    }

    renderCustomization(){
        return <Customization reloadPage={this.reloadPage.bind(this)} parentState={this.state} parentProps={this.props} />;
    }

    render() {
        if(this.state.isLoading){
            return(
                <div><ProgressSpinner/></div>
            );
        }

        return (
            <div>
                <Growl ref={(el) => this.growl = el} />

                {this.renderHeader()}

                <div className="content-section implementation">

                    <div className="p-grid">
                        <div className="p-col-6" >
                            <div className="p-grid">
                                {this.renderDataCard()}
                            </div>
                        </div>
                        <div className="p-col-6" >
                            <div className="p-grid">
                                {this.renderCustomization()}
                                {this.renderAssociationCards()}
                                {this.renderDangerZone()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
