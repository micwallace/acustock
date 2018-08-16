import { HTTP } from '@ionic-native/http';
import { Injectable } from '@angular/core';

import { PreferencesProvider } from "../preferences/preferences";
import { LoginPage } from "../../pages/login/login";

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

    constructor(public http:HTTP, public prefs:PreferencesProvider) {
        this.updateSettings(null, null);

        this.http.setHeader('*', 'Content-Type', 'application/json');
        this.http.setHeader('*', 'Accept', 'application/json');
        this.http.setDataSerializer('json');
    }

    updateSettings(username, password) {
        this.url = this.prefs.getPreference('connection_url');
        this.company = this.prefs.getPreference('connection_company');
        this.username = username != null ? username : this.prefs.getPreference('connection_username');
        this.password = password != null ? password : this.prefs.getPreference('connection_password');
    }

    public testConnection(username, password) {

        return new Promise((resolve, reject) => {

            this.updateSettings(username, password);

            this.login().then((res) => {

                resolve();

            }, (err) => {

                try {
                    var error = JSON.parse(err.error);

                    if (error.hasOwnProperty('exceptionMessage')) {
                        err.errorData = error;
                        err.message = error.exceptionMessage;
                    } else {
                        err.message = err.error;
                    }

                    reject(err);
                } catch (e) {
                    err.message = err.error;
                    reject(err);
                }
            }).catch((err)=> {
                err.message = err.error;
                reject(err);
            });
        });
    }

    login() {

        var data = {
            name: this.username,
            password: this.password,
            company: this.company
        };

        return this.http.post(this.url + '/entity/auth/login', data, {});
    }

    logout() {
        return this.http.post(this.url + '/entity/auth/login', null, {});
    }

    getItemList() {

        return this.get('StockItem?$expand=CrossReferences');
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

    getItemBatches(itemId:string, warehouseId:string, locationId:string) {

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
        return this.get("Shipment?$expand=" + expand + "&$filter=ShipmentNbr eq '" + shipmentNbr + "'");
    }

    getShipmentList() {
        return this.get("ShipmentPriorityList");
    }

    putShipment(data, expand = "Details,Details/Allocations") {
        return this.put("Shipment?$expand=" + expand, data, {});
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

    putPurchaseReceipt(data){
        return this.put("PurchaseReceipt", data, {});
    }

    releasePurchaseReceipt(referenceNbr){
        return this.postActionAndGetResult("PurchaseReceipt/ReleasePurchaseReceipt", {entity: {ReceiptNbr: {value: referenceNbr}}});
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
                url.pathname = res.headers.location;

                setTimeout(()=> {
                    this.getLongRunningOpResult(url.toString(), resolve, reject, 1);
                }, 3000);
            }).catch((err)=> {
                reject(err);
            });
        });
    }

    getLongRunningOpResult(url, resolve, reject, count) {
        this.http.get(url, {}, null).then((res:any)=> {

            if (res.status == 204)
                return resolve(true);

            if (res.data)
                return reject(JSON.stringify(res.data));

            setTimeout(()=> {
                this.getLongRunningOpResult(url, resolve, reject, count);
            }, 4000);

        }).catch((err)=> {
            err.message = err.error;
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

    request(method:string, endpoint:string, body?:any, headers?:any, params?:any, loginAttempt?:boolean, returnFullResponse?:any) {
        return new Promise((resolve, reject) => {

            let url = this.url + this.api_endpoint + '/' + endpoint;
            var promise;

            console.log(url);

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

            promise.then((res) => {

                if (res.status > 199 && res.status < 300) {

                    if (returnFullResponse)
                        return resolve(res);

                    if (res.status == 204)
                        return resolve(true);

                    try {
                        var data = JSON.parse(res.data);
                    } catch (e) {
                        reject({"message": "JSON parse error"});
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
                                reject(err);
                            }).catch((err) => {
                                reject(err);
                            });

                        }, (err) => {

                            try {
                                var error = JSON.parse(err.error);

                                if (error.hasOwnProperty('exceptionMessage')) {
                                    err.errorData = error;
                                    err.message = error.exceptionMessage;
                                } else {
                                    err.message = err.error;
                                }

                            } catch (e) {
                                err.message = err.error;
                            }

                            reject(err);
                            //this.navCtrl.setRoot(LoginPage, {message: "Login failed: " + err.message});

                        }).catch((err)=> {
                            err.message = err.error;
                            reject(err);
                        });
                    } else {
                        reject(err);
                        //this.navCtrl.setRoot(LoginPage, {message: "Session expired, please login."});
                    }
                    return;
                }

                try {
                    var error = JSON.parse(err.error);
                    err.message = "API Error: " + (error.hasOwnProperty('exceptionMessage') ? error.exceptionMessage : error.message);
                    err.errorData = error;

                    reject(err);
                } catch (e) {
                    err.message = err.error;
                    reject(err);
                }

            }).catch((err) => {
                err.message = err.error;
                reject(err);
            });

        });
    }
}
