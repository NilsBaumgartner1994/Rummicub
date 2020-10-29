import React, { Component } from "react";
import {init, getCriticalPaths} from "netzplan";

export class FunctionHelper extends Component {

    constructor() {
        super();
        this.x = "10";
        this.netzplan = {
            init,
            getCriticalPaths
        };
    }

    static parseArg(arg){
        console.log("parseArg: ");
        console.log(arg);
        if(!isNaN(arg)){
            return parseFloat(arg);
        }
        try{
            let obj = JSON.parse(arg);
            console.log(obj);
            return obj;
        } catch (err){
            return arg;
        }
    }

    static parseArgs(args){
        let parsedArgs = [];
        for(let i=0; i<args.length; i++){
            parsedArgs.push(FunctionHelper.parseArg(args[i]));
        }
        return parsedArgs;
    }

    static runFunction(fnString, args){
        console.log("runFunction: "+fnString);
        console.log(args);
        let parsedArgs = FunctionHelper.parseArgs(args);
        let func = new Function("return " + "function "+fnString)();
        let instance = new FunctionHelper();
        let result = func.apply(instance,parsedArgs);
        console.log("result");
        console.log(result);
        return result;
    }

}
