/*
 * This file is part of AcuStock
 * Copyright (c) 2018 Michael B Wallace
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { HTTP } from '@ionic-native/http';
import { Http, Headers, RequestOptions } from '@angular/http'
import { Injectable } from '@angular/core';
import { PreferencesProvider } from "./preferences";
import { Platform } from "ionic-angular";

/**
 * Api is a generic REST Api handler. Set your API url first.
 */
@Injectable()
export class Api {
    private api_endpoint:string = '/entity/AcuStock/6.00.001';

    private url:string = '';
    private username:string = '';
    private password:string = '';
    private company:string = '';

    private jsReqOptions:RequestOptions = new RequestOptions();

    constructor(public http:HTTP, public prefs:PreferencesProvider, public jsHttp:Http, public platform:Platform) {
        this.updateSettings(null, null);

        if (this.useNativeHttp()) {
            this.http.setHeader('*', 'Content-Type', 'application/json');
            this.http.setHeader('*', 'Accept', 'application/json');
            this.http.setDataSerializer('json');
        } else {
            let headers = new Headers();
            headers.append('Content-Type', 'application/json');
            headers.append('Accept', 'application/json');
            this.jsReqOptions.headers = headers;
            this.jsReqOptions.withCredentials = true;
        }
    }

    private useNativeHttp(){
        return (this.platform.is("android") || this.platform.is("ios"));
    }

    updateSettings(username, password) {
        this.url = this.prefs.getPreference('connection_url');
        this.company = this.prefs.getPreference('connection_company');
        this.username = username != null ? username : this.prefs.getPreference('connection_username');
        this.password = password != null ? password : this.prefs.getPreference('connection_password');
    }

    public testConnection(username, password) {

        return new Promise((resolve, reject) => {

            if (!this.prefs.isSetupComplete()){
                reject({message: "Please enter all required settings."});
                return;
            }

            this.updateSettings(username, password);

            this.login().then((res) => {

                // persist password if it's correct
                if (this.prefs.getPreference("remember_password")){
                    this.prefs.setPreference("connection_password", this.password, true);
                } else {
                    this.prefs.setPreference("connection_password", "", true);
                }

                resolve();
            }).catch((err)=> {
                reject(err);
            });

            // TODO: Acumatica plugin version test
        });
    }

    login() {

        var data = {
            name: this.username,
            password: this.password,
            company: this.company
        };

        return new Promise((resolve, reject)=> {
            if (this.useNativeHttp()) {
                this.http.post(this.url + '/entity/auth/login', data, {}).then((res)=>{
                    resolve(res);
                }, (err)=>{
                    reject(this.processApiError(err));
                }).catch((err)=> {
                    reject(this.processApiError(err));
                });
            } else {
                //this.jsReqOptions.withCredentials = false;
                this.jsHttp.post(this.url + '/entity/auth/login', JSON.stringify(data), this.jsReqOptions).toPromise().then((res)=> {
                    resolve(res);
                }).catch((err)=> {
                    reject(this.processApiError(err));
                });
            }
        });
    }

    logout() {
        return this.http.post(this.url + '/entity/auth/login', null, {});
    }

    getItem(itemId) {
        return this.get('StockItem/'+itemId+'?$expand=CrossReferences,WarehouseDetails');
    }

    getItemList(paramStr = "$expand=CrossReferences,WarehouseDetails") {
        return this.get('StockItem?'+paramStr);
    }

    itemLookup(itemId, paramStr = "$expand=Results"){
        return this.put("StockItemLookup?"+paramStr, {ItemID: {value: itemId}});
    }

    getWarehouseList() {
        return this.get("Warehouse?$expand=Locations");
    }

    getItemWarehouseLocations(itemId:string, warehouse:string) {
        var warehouseFilter = warehouse ? " and Warehouse eq '" + warehouse + "'" : "";

        return this.get("InventoryLocations?$filter=InventoryID eq '" + itemId + "'" + warehouseFilter);
    }

    getLocationContents(locationId:string, warehouse:string) {
        var warehouseFilter = warehouse ? " and Warehouse eq '" + warehouse + "'" : "";

        return this.get("InventoryLocations?$filter=Location eq '" + locationId + "'" + warehouseFilter);
    }

    getItemLotSerialInfo(itemId:string, warehouseId:string, locationId:string) {

        let filter = [];

        if (itemId)
            filter.push("InventoryID eq '" + itemId + "'");

        if (warehouseId)
            filter.push("Warehouse eq '" + warehouseId + "'");

        if (locationId)
            filter.push("Location eq '" + locationId + "'");

        return this.get("InventoryLotSerials" + (filter.length ? "?$filter=" + filter.join(" and ") : ""));
    }

    getShipment(shipmentNbr, expand = "Details,Details/Allocations") {
        return this.get("Shipment/" + shipmentNbr + "?"+(expand ? "$expand=" + expand : ""));
    }

    getShipmentList() {
        return this.get("ShipmentPriorityList");
    }

    putShipment(data, expand = "Details,Details/Allocations") {
        return this.put("Shipment"+(expand ? "?$expand=" + expand : ""), data, {});
    }

    confirmShipment(shipmentNbr){
        return this.postActionAndGetResult("Shipment/ConfirmShipment", {entity: {ShipmentNbr: {value: shipmentNbr}}});
    }

    correctShipment(shipmentNbr){
        return this.postActionAndGetResult("Shipment/CorrectShipment", {entity: {ShipmentNbr: {value: shipmentNbr}}});
    }

    getPurchaseOrder(orderNbr){
        return this.get("PurchaseOrder?$expand=Details&$filter=OrderNbr eq '" + orderNbr + "'");
    }

    putReceipt(data){
        return this.put("Receipt?$expand=Details,Details/Allocations", data, {});
    }

    releaseReceipt(referenceNbr){
        return this.postActionAndGetResult("Receipt/ReleaseReceipt", {entity: {ReferenceNbr: {value: referenceNbr}}});
    }

    deleteReceipt(referenceNbr){
        return this.delete("Receipt/" + referenceNbr);
    }

    putPurchaseReceipt(data){
        return this.put("PurchaseReceipt", data, {});
    }

    releasePurchaseReceipt(referenceNbr){
        return this.postActionAndGetResult("PurchaseReceipt/ReleasePurchaseReceipt", {entity: {ReceiptNbr: {value: referenceNbr}}});
    }

    deletePurchaseReceipt(referenceNbr){
        return this.delete("PurchaseReceipt/" + referenceNbr);
    }

    getTransfer(referenceNbr){
        return this.get("Transfer/" + referenceNbr + "?$expand=Details");
    }

    putTransfer(data) {
        return this.put("Transfer", data, {});
    }

    deleteTransfer(transferId:string) {
        return this.delete("Transfer/" + transferId);
    }

    releaseTransfer(transferId:string) {
        return this.postActionAndGetResult("Transfer/Release", {entity: {ReferenceNbr: {value: transferId}}});
    }

    putAdjustment(data) {
        return this.put("Adjustment", data, {});
    }

    deleteAdjustment(transferId:string) {
        return this.delete("Adjustment/" + transferId);
    }

    releaseAdjustment(transferId:string) {
        return this.postActionAndGetResult("Adjustment/ReleaseAdjustment", {entity: {ReferenceNbr: {value: transferId}}});
    }

    getCount(referenceNbr) {
        return this.get("PhysicalInventoryReview/" + referenceNbr + "?$expand=Details");
    }

    putCount(data) {
        return this.put("PhysicalInventoryReview?$expand=Details", data, {});
    }

    postActionAndGetResult(endpoint:string, body:any) {

        return new Promise((resolve, reject) => {

            this.http.setHeader('*', 'Content-Type', 'application/json');
            this.http.setHeader('*', 'Accept', 'application/json');
            this.http.setDataSerializer('json');

            this.request('post', endpoint, body, {}, {}, false, true).then((res:any)=> {

                if (res.status == 204)
                    return resolve(true);

                var url = new URL(this.url);
                url.pathname = this.useNativeHttp() ? res.headers.location : res.headers.get('Location');

                setTimeout(()=> {
                    this.getLongRunningOpResult(url.toString(), resolve, reject, 1);
                }, 3000);
            }).catch((err)=> {
                reject(err);
            });
        });
    }

    getLongRunningOpResult(url, resolve, reject, count) {

        var req;
        if (this.useNativeHttp()) {
            req = this.http.get(url, {}, null);
        } else {
            req = new Promise((resolve, reject)=>{
                this.jsHttp.get(url, this.jsReqOptions).toPromise().then((res)=>{
                    resolve(res);
                }).catch((err)=>{
                    reject(err);
                });
            });
        }

        req.then((res:any)=> {

            if (res.status == 204)
                return resolve(true);

            if (res.data)
                return reject(JSON.stringify(res.data));

            setTimeout(()=> {
                this.getLongRunningOpResult(url, resolve, reject, count);
            }, 4000);

        }, (err)=>{
            reject(this.processApiError(err));
        }).catch((err)=> {
            reject(err);
        });
    }

    get(endpoint:string, params?:any, headers?:any) {
        return this.request('get', endpoint, null, headers, params);
    }

    post(endpoint:string, body:any) {
        this.http.setHeader('*', 'Content-Type', 'application/json');
        this.http.setHeader('*', 'Accept', 'application/json');
        this.http.setDataSerializer('json');

        return this.request('post', endpoint, body, {});
    }

    put(endpoint:string, body:any, headers?:any) {
        // sometimes cordova plugin isn't initialized when the contructor runs resulting in these values not being set
        // this is a cheap workaround
        this.http.setHeader('*', 'Content-Type', 'application/json');
        this.http.setHeader('*', 'Accept', 'application/json');
        this.http.setDataSerializer('json');

        return this.request('put', endpoint, body, headers);
    }

    delete(endpoint:string, headers?:any) {
        return this.request('delete', endpoint, null, headers);
    }

    request(method:string, endpoint:string, body?:any, headers?:any, params?:any, loginAttempt:boolean=false, returnFullResponse?:any) {
        return new Promise((resolve, reject) => {

            let url = this.url + this.api_endpoint + '/' + endpoint;
            var promise;

            console.log(url);

            if (this.useNativeHttp()) {

                switch (method) {
                    case "get":
                        promise = this.http.get(url, headers, params);
                        break;

                    case "post":
                        promise = this.http.post(url, body, headers);
                        break;

                    case "put":
                        promise = this.http.put(url, body, headers);
                        break;

                    case "delete":
                        promise = this.http.delete(url, params, headers);
                        break;
                }

            } else {

                let req;
                //this.jsReqOptions.withCredentials = true;

                switch (method) {
                    case "get":
                        req = this.jsHttp.get(url, this.jsReqOptions).toPromise();
                        break;

                    case "post":
                        req = this.jsHttp.post(url, JSON.stringify(body), this.jsReqOptions).toPromise();
                        break;

                    case "put":
                        req = this.jsHttp.put(url, JSON.stringify(body), this.jsReqOptions).toPromise();
                        break;

                    case "delete":
                        req = this.jsHttp.delete(url, this.jsReqOptions).toPromise();
                        break;
                }

                promise = new Promise((resolve, reject)=>{
                    req.then((res)=>{
                        resolve(res);
                    }).catch((err)=>{
                        reject(err);
                    });
                });
            }

            promise.then((res) => {

                if (res.status > 199 && res.status < 300) {

                    if (returnFullResponse)
                        return resolve(res);

                    if (res.status == 204)
                        return resolve(true);

                    try {
                        var data = this.useNativeHttp() ? JSON.parse(res.data) : res.json();
                    } catch (e) {
                        reject({"message": "JSON parse error: " + JSON.stringify(e)});
                        return;
                    }

                    return resolve(data);
                }

                reject({message: "Unknown error:" + res.error});

            }, (err) => {

                if (err.status == 401) {

                    if (this.prefs.hasPreference("connection_password") && !loginAttempt) {

                        this.login().then((res) => {

                            this.request(method, endpoint, body, headers, params, true).then((res) => {
                                resolve(res);
                            }, (err) => {
                                reject(this.processApiError(err));
                            }).catch((err) => {
                                reject(this.processApiError(err));
                            });

                        }, (err) => {

                            reject(this.processApiError(err));

                        }).catch((err)=> {

                            reject(this.processApiError(err));
                        });
                    } else {
                        reject(err);
                    }
                    return;
                }

                reject(this.processApiError(err));

            }).catch((err) => {
                err.message = err.error;
                reject(err);
            });

        });
    }

    private processApiError(err:any){

        if (typeof err === 'string')
            return {message: err};

        // Process the exception and add a user displayed message and other debug info
        try {
            err.responseData =  this.useNativeHttp() ? JSON.parse(err.error) : err.json();
            this.useNativeHttp() ? delete err.error : delete err._body;
        } catch (e) {}

        console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));

        delete err.headers;

        // Build error message
        if (err.responseData && err.responseData.type != "error"){
            var exceptionMsg = (err.responseData.hasOwnProperty('exceptionMessage') ? err.responseData.exceptionMessage : err.responseData.message);

            // Detect not found error and modify status to 404: Acumatica, do you even no what REST is!!
            if (err.responseData.hasOwnProperty('exceptionType') &&
                err.responseData.exceptionType == "PX.Api.ContractBased.NoEntitySatisfiesTheConditionException")
                err.status = 404;

            // Detect login error
            if (exceptionMsg.indexOf("Invalid credentials") > -1 ||
                exceptionMsg.indexOf("locked out") > -1 ||
                exceptionMsg.indexOf("account is disabled") > -1 ||
                exceptionMsg.indexOf("account has been disabled") > -1) {
                err.status = 401;
                err.authFailed = true;
            }

            if (!err.responseData.hasOwnProperty('exceptionMessage'))
                err.responseData.exceptionMessage = err.responseData.message;

            var ellipse =  exceptionMsg.length > 500 ? "..." : "";

            err.message = "API Error: " + (err.hasOwnProperty("status") ? err.status+" " : "") + exceptionMsg.substring(0, 500) + ellipse;

        } else {
            // CORS errors return status 0, give the user a hint.
            if (err.status == 0 && err.statusText == "")
                err.statusText = "Unidentifiable error. This may be a network or CORS related issue.";

            err.message = (err.hasOwnProperty("status") ? err.status+" " : "") + (err.hasOwnProperty("statusText") ? err.statusText+" " : "")
                + (err.hasOwnProperty("error") ? err.error : "")
        }

        return err;
    }
}
