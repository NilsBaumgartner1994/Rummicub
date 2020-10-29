import React, {Component} from 'react';
import {SequelizeConnector} from "./SequelizeConnector";
import {APIRequest} from "./APIRequest";
import {RouteHelper} from "./RouteHelper";
import {RequestHelper} from "./RequestHelper";

export class ResourceHelper extends Component {

    static async handleRequestTypeOnMultipleResources(resources, tableName, requestType,progessCallback=null){
        let amountResources = resources.length;
        let errorList = [];
        let successList = [];
        for(let i=0; i<amountResources; i++){
            let resource = resources[i];
            if(!!progessCallback){
                progessCallback(i,amountResources,requestType);
            }
            let answer = await ResourceHelper.handleRequestTypeOnResource(resource, tableName, requestType);
            let success = RequestHelper.isSuccess(answer);
            if(success){
                successList.push(resource);
            } else {
                errorList.push(answer);
            }
        }
        return {
            success: successList,
            errors: errorList,
        }
    }

    static async handleRequestTypeOnResource(resource, tableName, requestType, payloadJSON){
        let schemes = await SequelizeConnector.getSchemes();
        let scheme = await SequelizeConnector.getScheme(tableName);
        let route = RouteHelper.getInstanceRouteForResource(schemes,scheme,tableName,resource);
        let answer = await APIRequest.sendRequestWithAutoAuthorize(requestType,route, payloadJSON);
        return answer;
    }

}
