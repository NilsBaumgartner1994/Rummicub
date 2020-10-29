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
import {InputSwitch} from "../../components/inputswitch/InputSwitch";
import {WindowHelper} from "../../helper/WindowHelper";
import {SequelizeConnector} from "../../sequelizeConnector/SequelizeConnector";
import {APIRequest} from "../../sequelizeConnector/APIRequest";
import {SelectButton} from "../../components/selectbutton/SelectButton";
import {MyImageUploader} from "../../helper/MyImageUploader";

export class ResourceCreateComponent extends Component {

    /**
     * @param props
     * {
     *  blockOpenWindowNewResource: boolean,
     *  onHandleResourceCreated: callback(resource),
     *
     * }
     */
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            isEdited: false,
            jsonEditorsVisible: {},
            jsonEditorsValues: {},
            requestPending: false,
            visibleDialogDeleteResource: false,
        };
    }

    componentDidMount() {
        this.loadResources();
    }

    async loadResources(){
        console.log("ResourceCreateComponent: loadResources");
        let tableName = this.props.tableName;
        let scheme = await SequelizeConnector.getScheme(tableName);
        let route = await RouteHelper.getIndexRouteForResourceAsync(tableName);
        let routes = await SequelizeConnector.getSchemeRoutes(tableName);

        this.setState({
            isLoading: false,
            resource: {},
            route: route,
            routes: routes,
            scheme: scheme,
        });
    }

    async createResource(){
        let payloadJSON = this.state.resource;
        let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_POST,this.state.route,payloadJSON);
        if(!RequestHelper.isSuccess(answer)) {
            let detail = !answer ? 'Unkown error!' : answer.error;
            this.setState({
                requestPending: false,
            });
            this.growl.show({severity: 'error', summary: 'Error', detail: detail});
        } else {
            this.growl.show({severity: 'success', summary: 'Success', detail: 'Changes saved'});
            //TODO Go To Instance Side
            let resource = answer.data;
            this.setState({
                resource: resource,
                requestPending: false,
            });
            if(!this.props.blockOpenWindowNewResource){
                WindowHelper.openUrl(this.getInstanceRoute(resource));
            }
            if(!!this.props.onHandleResourceCreated){
                this.props.onHandleResourceCreated(resource);
            }
        }
    }

    getInstanceRoute(resource){
        let schemeRouteGET = this.state.routes["GET"];
        schemeRouteGET = schemeRouteGET.replace("/api","");

        let tableName = this.props.tableName;
        let primaryAttributeKeys = SchemeHelper.getPrimaryAttributeKeys(this.state.scheme);
        for(let i=0;i<primaryAttributeKeys.length; i++){
            let key = primaryAttributeKeys[i];
            let value = resource[key];
            if(!!value){
                let routeParamKey = ":"+tableName+"_"+key;
                schemeRouteGET = schemeRouteGET.replace(routeParamKey,value);
            }
        }

        if(schemeRouteGET.includes(":")){ //if there are still unresolved params, we have no complete route
            return undefined;
        }

        let route = schemeRouteGET;
        return route;
    }

    renderDataCard(){
        return(
            <div className="p-col">
                <Card title={"Data"} style={{width: '500px'}}>
                    <div>{}</div>
                    <table style={{border:0}}>
                        <tbody>
                        {this.renderDataFields()}
                        </tbody>
                    </table>
                    <br></br>
                    {this.renderCreateButton()}
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

    renderResetButton(){
        if(this.state.isEdited && !this.state.requestPending){
            return(<Button style={{"margin-right":"1em"}} className="p-button-raised" label="Reset" icon="pi pi-undo" iconPos="right" onClick={() => {this.resetResource()}} />);
        } else {
            return(<Button style={{"margin-right":"1em"}} className="p-button-raised" label="Reset" icon="pi pi-undo" iconPos="right" disabled="disabled" />);
        }
    }

    renderCreateButton(){
        if(!this.state.requestPending){
            return(<Button style={{"margin-right":"1em"}} className="p-button-raised" label="Create" icon="pi pi-plus" iconPos="right" onClick={() => {this.createResource()}} />);
        } else {
            return(<Button style={{"margin-right":"1em"}} className="p-button-raised" label="Create" icon="pi pi-plus" iconPos="right" disabled="disabled" />);
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
            let isEditable = SchemeHelper.isEditable(this.state.scheme, attributeKey);
            if(isEditable){
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
        let attributeKeyRow = <th>{starField}{attributeKey}</th>

        return(
            <tr>
                {attributeKeyRow}
                <td>{valueField}</td>
            </tr>
        )
    }

    handleSaveEditedValue(attributeKey, event){
        this.handleSaveEditedRawValue(attributeKey,event.target.value);
    }

    handleSaveEditedRawValue(attributeKey, value){
        this.state.resource[attributeKey] = value ;
        this.saveResourceChange();
    }

    renderEditableField(attributeKey){
        let attributeType = SchemeHelper.getType(this.state.scheme,attributeKey);
        switch(attributeType){
            case "STRING": return this.renderEditableTextField(attributeKey);
            case "BOOLEAN": return this.renderEditableBooleanField(attributeKey);
            case "INTEGER": return this.renderEditableIntegerField(attributeKey);
            case "DATE": return this.renderEditableDateField(attributeKey);
            case "JSON": return this.renderEditableJSONField(attributeKey);
        }
        if(this.props.tableName==="Images"){
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

        /**
        reader.addEventListener("load", function () { // Setting up base64 URL on image
            console.log("onload");
            let data = reader.result; // ergebnis vom filereader auslesen
            console.log(data);
            instance.handleSaveEditedRawValue(attributeKey,data);
        }, false);

        // Die Datei einlesen und in eine Data-URL konvertieren
        reader.readAsDataURL(file);
        */

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

    renderImageBlob(attributeKey){
        let blob = this.state.resource[attributeKey];
        if(!!blob){
            console.log(blob);
            return null;
        } else {
            return null;
        }
    }

    renderImageBlobField(attributeKey){
        console.log("renderBlobField");
        console.log(this.state.resource[attributeKey]);
        return(
            <div>
                <div className="p-inputgroup">
                    <MyImageUploader handleUpload={this.handleUpload.bind(this,attributeKey)} tableName={this.props.tableName} />
                </div>
                {this.renderImageBlob(attributeKey)}
            </div>
        );
    }

    renderEditableTextField(attributeKey){
        let maxLength = SchemeHelper.getTypeStringMaxLength(this.state.scheme,attributeKey);
        let resourceValue = this.state.resource[attributeKey] || "";
        let remeiningChars = maxLength-resourceValue.length;

        return(
            <div>
                <div className="p-inputgroup">
                    <InputTextarea id="float-input" maxLength={maxLength} type="text" size="30" value={resourceValue} onChange={this.handleSaveEditedValue.bind(this,attributeKey)} />
                    <Button icon="pi pi-times" className="p-button-danger" onClick={() => {this.state.resource[attributeKey] = null; this.saveResourceChange()}} />
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
                <Button icon="pi pi-times" className="p-button-danger" onClick={() => {this.state.resource[attributeKey] = null; this.saveResourceChange()}} />
            </div>
        );
    }

    renderEditableJSONField(attributeKey){
        let rawValue = this.state.resource[attributeKey];
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
                <Calendar value={value} showTime={true} showSeconds={true} monthNavigator={true} touchUI={true} yearNavigator={true} yearRange="1990:2030" showButtonBar={true} onChange={this.handleSaveEditedValue.bind(this,attributeKey)} />
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

    renderHeader(){
        return(
            <div className="content-section introduction">
                <div className="feature-intro">
                    <h1>{this.props.tableName}</h1>
                    <p>Creation</p>
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

        return (
            <div>
                <Growl ref={(el) => this.growl = el} />

                {this.renderHeader()}

                <div className="content-section implementation">

                    <div className="p-grid">
                        {this.renderDataCard()}
                    </div>
                </div>
            </div>
        );
    }
}
