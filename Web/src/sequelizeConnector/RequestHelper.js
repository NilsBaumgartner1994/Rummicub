import {MyStorage} from "../helper/MyStorage";
import {AuthConnector} from "./AuthConnector";

export class RequestHelper {

    static REQUEST_TYPE_GET = "GET";
    static REQUEST_TYPE_POST = "POST";
    static REQUEST_TYPE_PUT = "PUT";
    static REQUEST_TYPE_DELETE = "DELETE";


    static getAPIURL(){
        let base_url = window.location.origin;
        //console.log("base_url");
        //console.log(base_url);
        return base_url+"/api/";
    }

    /**
     * Privater
     * @param requestType
     * @param resource_url
     * @param payload_json
     * @param headers
     * @returns {Promise<undefined|any>}
     */
    static async private_sendRequest(requestType, resource_url, payload_json = {}, headers){
        //console.warn("SendRequest to: "+url);
        let payload = JSON.stringify(payload_json);

        resource_url = RequestHelper.getAPIURL()+resource_url;
        //console.log("resource_url:");
        //console.log(resource_url);

        let response = undefined;
        //console.log("private_sendRequest: payload: ");
        //console.log(payload_json);

        if(requestType===RequestHelper.REQUEST_TYPE_GET){
            response = await fetch(resource_url, {
                method: requestType,
                credentials: 'include',
                headers: headers,
            });
        } else {
            response = await fetch(resource_url, {
                method: requestType,
                headers: headers,
                credentials: 'include',
                body: payload,
            });
        }
        try {

            //console.log(response);
            let answer = await response.json();
            //console.log(answer);
            return answer;
        } catch(e){
            console.log("Error at: ");
            console.log(e);
            console.log("requestType: "+requestType);
            console.log("resource_url: "+resource_url);
            console.log("payload_json: "+payload_json);
            return undefined;
        }
    }

    static isSuccess(answer){
        return !!answer && answer.success;
    }

    static async sendRequestWithAccessToken(requestType, resource_url, payload_json){
        let headers = RequestHelper.getHeadersWithAccessToken();
        let answer = await RequestHelper.private_sendRequest(requestType, resource_url, payload_json,headers);
        return answer;
    }

    static async sendRequest(requestType, resource_url, payload_json){
        let headers = new Headers({
            "Content-Type": "application/json",
        });
        return await RequestHelper.private_sendRequest(requestType, resource_url, payload_json,headers);
    }

    static getHeadersWithAccessToken(){
        let accessToken = MyStorage.getItem(MyStorage.CREDENTIALS_ACCESSTOKEN);
        let headers = new Headers({
            Authorization: "AccessToken " + accessToken,
            "Content-Type": "application/json",
        });
        return headers;
    }

}
