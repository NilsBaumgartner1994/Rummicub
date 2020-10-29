import React, {Component} from 'react';
import {SequelizeConnector} from "./SequelizeConnector";
import {APIRequest} from "./APIRequest";
import {RouteHelper} from "./RouteHelper";
import {RequestHelper} from "./RequestHelper";
import {DataTableHelper} from "../screens/dataview/DataTableHelper";

export class ResourceAssociationHelper extends Component {

    static async handlePostAssociationsForResource(resource, tableName, associationTableName,associationResources){
        console.log("handlePostAssociationsForResource");
        let schemes = await SequelizeConnector.getSchemes();
        let scheme = await SequelizeConnector.getScheme(tableName);
        let route = RouteHelper.getIndexRouteForAssociation(schemes,scheme,tableName,resource,associationTableName);

        let url = route;
        console.log(url);
        let amountAssociatedResources = associationResources.length;

        let errorList = [];
        let successList = [];
        for(let i=0; i<amountAssociatedResources; i++){
            let associationResource = associationResources[i];
            let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_POST,url,associationResource);
            let success = RequestHelper.isSuccess(answer);
            if(success){
                successList.push(associationResource);
            } else {
                errorList.push(answer);
            }
        }
        return {
            success: successList,
            errors: errorList,
        }
    }

    static async handleGetAssociationsForResource(resource, tableName, associationTableName,filterParams={}){
        console.log("handleGetAssociationsForResource");
        console.log(filterParams);
        let schemes = await SequelizeConnector.getSchemes();
        let scheme = await SequelizeConnector.getScheme(tableName);
        let route = RouteHelper.getIndexRouteForAssociation(schemes,scheme,tableName,resource,associationTableName);
        let filterParam = DataTableHelper.getURLFilterParamsAddon(filterParams);

        let url = route+"?"+filterParam;
        console.log(url);
        let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_GET,url);
        if(RequestHelper.isSuccess(answer)) {
            return answer.data;
        }
        return null;
    }

    static async handleRequestTypeOnMultiplePluralAssociation(resource, tableName, associationTableName, associationName, associationResources, requestType){
        let amountAssociatedResources = associationResources.length;
        let errorList = [];
        let successList = [];
        for(let i=0; i<amountAssociatedResources; i++){
            let associationResource = associationResources[i];
            let answer = await ResourceAssociationHelper.handleRequestTypeOnPluralAssociation(resource, tableName, associationTableName, associationName, associationResource, requestType);
            let success = RequestHelper.isSuccess(answer);
            if(success){
                successList.push(associationResource);
            } else {
                errorList.push(answer);
            }
        }
        return {
            success: successList,
            errors: errorList,
        }
    }

    static async handleRequestTypeOnPluralAssociation(resource, tableName, associationTableName, associationName, associationResource, requestType){
        let associationModelscheme = await SequelizeConnector.getScheme(associationTableName);
        let schemes = await SequelizeConnector.getSchemes();
        let scheme = await SequelizeConnector.getScheme(tableName);
        let route = RouteHelper.getInstanceRouteForAssociatedResource(schemes,scheme,tableName,resource,associationModelscheme,associationTableName,associationName,associationResource);
        let answer = await APIRequest.sendRequestWithAutoAuthorize(requestType,route);
        return answer;
    }

}
