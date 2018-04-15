import { HTTP } from '@ionic-native/http';
import { Injectable } from '@angular/core';

import { PreferencesProvider } from "../preferences/preferences";

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

    constructor(public http:HTTP, public prefs: PreferencesProvider) {
        this.updateSettings();

        this.http.setHeader('Content-Type', 'application/json');
        this.http.setHeader('Accept', 'application/json');
        this.http.setDataSerializer('json');
    }

    updateSettings() {
        this.url = this.prefs.getPreference('connection_url');
        this.username = this.prefs.getPreference('connection_username');
        this.password = this.prefs.getPreference('connection_password');
        this.company = this.prefs.getPreference('connection_company');
    }

    public testConnection() {

        return new Promise((resolve, reject) => {

            this.updateSettings();

            this.login().then((res) => {

                resolve();

            }, (err) => {

                try {
                    var error = JSON.parse(err.error);

                    if (error.hasOwnProperty('exceptionMessage')){
                        err.errorData = error;
                        err.message = error.exceptionMessage;
                    } else {
                        err.message = err.error;
                    }

                    reject(err);
                } catch (e){
                    err.message = err.error;
                    reject(err);
                }
            }).catch((err)=>{
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

    getItemList() {

        return this.get('StockItem?$expand=CrossReferences');
    }

    getWarehouseList() {
        return this.get("Warehouse?$expand=Locations");
    }

    getItemWarehouseLocations(itemId:string, warehouse:string) {
        var warehouseFilter = warehouse ? " and WarehouseID eq '" + warehouse + "'" : "";

        return this.get("InventoryLocations?$filter=InventoryID eq '" + itemId + "'" + warehouseFilter);
    }

    getLocationContents(locationId:string, warehouse:string) {
        var warehouseFilter = warehouse ? " and WarehouseID eq '" + warehouse + "'" : "";

        return this.get("InventoryLocations?$filter=LocationID eq '" + locationId + "'" + warehouseFilter);
    }

    getItemBatches(itemId:string, warehouseId:string, locationId:string){

        let filter = [];

        if (itemId)
            filter.push("InventoryID eq '"+itemId+"'");

        if (warehouseId)
            filter.push("WarehouseID eq '"+warehouseId+"'");

        if (locationId)
            filter.push("LocationID eq '"+locationId+"'");

        return this.get("InventoryLotSerials" + (filter.length ? "?$filter=" + filter.join(" and ") : ""));
    }

    getShipment(shipmentNbr){
        return this.get("Shipment?$expand=Details,Details/Allocations&$filter=ShipmentNbr eq '" + shipmentNbr + "' and Operation eq 'Issue'");
    }

    getShipmentList(){
        return this.get("ShipmentPriorityList");
    }

    get(endpoint:string, params?:any, reqOpts?:any) {
        return this.request('get', endpoint, null, reqOpts, params);
    }

    post(endpoint:string, body:any) {
        return this.request('post', endpoint, body, {});
    }

    put(endpoint:string, body:any, reqOpts?:any) {
        return this.request('put', endpoint, body, reqOpts);
    }

    delete(endpoint:string, reqOpts?:any) {
        return this.request('delete', endpoint, null, reqOpts);
    }

    request(method:string, endpoint:string, body?:any, reqOpts?:any, params?:any) {
        return new Promise((resolve, reject) => {

            let url = this.url + this.api_endpoint + '/' + endpoint;
            var promise;

            switch (method) {
                case "get":
                    promise = this.http.get(url, reqOpts, params);
                    break;

                case "post":
                    promise = this.http.post(url, body, reqOpts);
                    break;

                case "put":
                    promise = this.http.put(url, body, reqOpts);
                    break;

                case "delete":
                    promise = this.http.delete(url, params, reqOpts);
                    break;
            }

            promise.then((res) => {

                if (res.status > 199 && res.status < 300) {

                    try {
                        var data = JSON.parse(res.data);
                    } catch (e){
                        reject({"message": "JSON parse error"});
                        return;
                    }

                    resolve(data);
                }

                reject({message: "Unknown error:" + res.error});

            }, (err) => {

                try {
                    var error = JSON.parse(err.error);
                    err.message = "API Error: " + (error.hasOwnProperty('exceptionMessage') ? error.exceptionMessage : error.message);
                    err.errorData = error;

                    reject(err);
                } catch (e){
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
