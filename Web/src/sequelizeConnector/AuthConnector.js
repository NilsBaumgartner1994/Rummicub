import React, {Component} from 'react';
import {RequestHelper} from "./RequestHelper";
import {MyStorage} from "../helper/MyStorage";
import {APIRequest} from "./APIRequest";

export class AuthConnector extends Component {

    static auths = null;

    static async getAuths(){
        if(!AuthConnector.auths){
            let answer = await RequestHelper.sendRequest(RequestHelper.REQUEST_TYPE_GET,"auth/methods");
            if(RequestHelper.isSuccess(answer)){
                AuthConnector.auths = answer.data;
            }
        }
        return AuthConnector.auths || {};
    }

    static async createAccessToken(authObject){
        let answer = await RequestHelper.sendRequest(RequestHelper.REQUEST_TYPE_POST,"auth/accessToken",{auth: authObject});
        if(RequestHelper.isSuccess(answer)){
            let accessToken = answer.data.accessToken;
            MyStorage.setItem(MyStorage.CREDENTIALS_ACCESSTOKEN,accessToken);
        }
        return answer;
    }

    static async refreshAccessToken(){
        let refreshToken = MyStorage.getRefreshToken();
        let answer = await RequestHelper.sendRequest(RequestHelper.REQUEST_TYPE_POST,"auth/refresh", {refreshToken: refreshToken});
        if(RequestHelper.isSuccess(answer)){
            let accessToken = answer.data.accessToken;
            MyStorage.setItem(MyStorage.CREDENTIALS_ACCESSTOKEN,accessToken);
        } else {
            MyStorage.removeRefreshToken();
        }
        return answer;
    }

    static async authorize(authObject, rememberMe=false){
        let answer = await RequestHelper.sendRequest(RequestHelper.REQUEST_TYPE_POST,"auth/authorize",{auth: authObject, rememberMe: rememberMe});
        if(RequestHelper.isSuccess(answer)){
            let data = answer.data;
            let currentUser = data.currentUser;
            let accessToken = data.accessToken;
            let refreshToken = data.refreshToken;
            MyStorage.rememberMe(rememberMe);
            MyStorage.setItem(MyStorage.CREDENTIALS_AUTHMETHOD,authObject["authMethod"]);
            MyStorage.setItem(MyStorage.CREDENTIALS_CURRENT_USER,JSON.stringify(currentUser));
            MyStorage.setItem(MyStorage.CREDENTIALS_ACCESSTOKEN,accessToken);
            MyStorage.storeRefreshToken(refreshToken);
        } else {
            AuthConnector.resetAuthStorage();
        }
        return answer;
    }

    static async loadFromServerCurrentUser(){
        let answer = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_GET,"auth/currentUser");
        if(RequestHelper.isSuccess(answer)){
            return answer.data;
        }
        return null;
    }

    static async isLoggedInUser(){
        let currentUser = await AuthConnector.loadFromServerCurrentUser();
        return !!currentUser;
    }

    static resetAuthStorage(){
        MyStorage.rememberMe(false);
        MyStorage.removeItem(MyStorage.CREDENTIALS_AUTHMETHOD);
        MyStorage.removeItem(MyStorage.CREDENTIALS_CURRENT_USER);
        MyStorage.removeItem(MyStorage.CREDENTIALS_ACCESSTOKEN);
        MyStorage.removeRefreshToken();
    }

    static async logout(){
        let refreshToken = MyStorage.getRefreshToken();
        let answer = await RequestHelper.sendRequest(RequestHelper.REQUEST_TYPE_POST,"auth/logout", {refreshToken: refreshToken});
        AuthConnector.resetAuthStorage();
        await APIRequest.handleLogout();
        return answer;
    }

    static async logoutFromAllDevices(authObject){
        let answer = await RequestHelper.sendRequest(RequestHelper.REQUEST_TYPE_POST,"auth/logoutFromAllDevices", {auth: authObject});
        if(RequestHelper.isSuccess(answer)){
            AuthConnector.resetAuthStorage();
            APIRequest.handleLogout();
            return answer.data;
        }
        return null;
    }

}
