import React, { Component } from "react";

export class MyStorage extends Component {

    static STORAGE_REMEMBERME = "RememberMe";

    static STORAGE_CREDENTIALS = "Credentials";
    static CREDENTIALS_AUTHMETHOD = MyStorage.STORAGE_CREDENTIALS+"."+"AuthMethod";
    static CREDENTIALS_CURRENT_USER = MyStorage.STORAGE_CREDENTIALS+"."+"CurrentUser";
    static CREDENTIALS_ACCESSTOKEN = MyStorage.STORAGE_CREDENTIALS+"."+"AccessToken";
    static CREDENTIALS_REFRESHTOKEN = MyStorage.STORAGE_CREDENTIALS+"."+"RefreshToken";

    static rememberMe(remember){
        //USE LocalStorage ! Instead we can't remember if we want to remember at things
        localStorage.setItem(MyStorage.STORAGE_REMEMBERME, remember+"");
    }

    //sessionStorage.getItem for Session based storage
    static rememberMeActive(){
        let remember = true+""===localStorage.getItem(MyStorage.STORAGE_REMEMBERME);
        return remember;
    }

    static storeRefreshToken(refreshToken){
        if(MyStorage.rememberMeActive()){
            //no need to store it, since its saved as cookie
            return true;
        } else {
            return sessionStorage.setItem(MyStorage.CREDENTIALS_REFRESHTOKEN,refreshToken);
        }
    }

    static removeRefreshToken(){
        return sessionStorage.removeItem(MyStorage.CREDENTIALS_REFRESHTOKEN);
    }

    static getRefreshToken(){
        if(MyStorage.rememberMeActive()){
            //no need to store it, since its saved as cookie
            return null;
        } else {
            return sessionStorage.getItem(MyStorage.CREDENTIALS_REFRESHTOKEN);
        }
    }

    static getStorage(){
        return MyStorage.rememberMeActive() ? localStorage : sessionStorage;
    }

    static setItem(key, data){
        return MyStorage.getStorage().setItem(key, data);
    }

    static getItem(key){
        return MyStorage.getStorage().getItem(key);
    }

    static removeItem(key){
        return MyStorage.getStorage().removeItem(key);
    }

    static getCurrentUser(){
        let currentUserAsString = MyStorage.getItem(MyStorage.CREDENTIALS_CURRENT_USER);
        if(!!currentUserAsString){
            return JSON.parse(currentUserAsString);
        }
        return null;
    }

    static clear(){
        sessionStorage.clear();
        return localStorage.clear();
    }

}
