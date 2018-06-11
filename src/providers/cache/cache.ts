import { Injectable } from '@angular/core';
import { Api } from "../api/api";
import { PreferencesProvider } from "../preferences/preferences";

/*
 Generated class for the CacheProvider provider.

 See https://angular.io/guide/dependency-injection for more info on providers
 and Angular DI.
 */
@Injectable()
export class CacheProvider {

    itemList = null;
    binList = null;
    binIndex = null;
    warehouseList = null;

    constructor(public api:Api, public prefs: PreferencesProvider) {
        console.log('Hello CacheProvider Provider');
    }

    public getItemList() {
        return new Promise((resolve, reject) => {

            if (this.itemList == null) {
                this.initialLoad().then((res) => {
                    resolve(this.itemList);
                }).catch((err) => {
                    reject(err);
                });
                return;
            }

            resolve(this.itemList);
        });
    }

    public getItemById(id){

        return new Promise((resolve, reject)=>{

            this.getItemList().then((itemList: any)=>{

                for (var i=0; i<itemList.length; i++){

                    if (itemList[i].InventoryID.value == id){

                        resolve(itemList[i]);
                        return;
                    }


                    for (var x=0; x<itemList[i].CrossReferences.length; x++){

                        if (itemList[i].CrossReferences[x].AlternateID.value == id){

                            resolve(itemList[i]);
                            return;
                        }

                    }
                }

                reject({message: "The item with ID " + id + " was not found."});

                // TODO: Perform fresh lookup on cache expiry

            }).catch((err)=>{
                reject(err);
            })
        });
    }

    public getBinList() {

        return new Promise((resolve, reject) => {

            if (this.binList == null) {
                this.initialLoad().then(() => {
                    resolve(this.binList);
                }).catch((err) => {
                    reject(err);
                });
                return;
            }

            resolve(this.binList);
        });

    }

    public getBinById(id){
        return new Promise((resolve, reject)=>{

            if (this.binIndex && this.binIndex.hasOwnProperty(id)){
                resolve(this.binIndex[id]);
                return;
            }

            this.getBinList().then((binList: any)=>{

                if (this.binIndex.hasOwnProperty(id)){
                    resolve(this.binIndex[id]);
                    return;
                }

                reject({message: "No location found with ID "+id});

                // TODO: Perform fresh lookup on cache expiry
            }).catch((err) => {
                reject(err);
            });
        });
    }

    public generateBinList(){
        var found = false;
        for (var i = 0; i < this.warehouseList.length; i++) {
            if (this.warehouseList[i].WarehouseID.value == this.prefs.getPreference('warehouse')) {
                this.binList = this.warehouseList[i].Locations;
                found = true;
                break;
            }
        }

        // Warehouse not found, default to first loaded warehouse
        if (!found) {
            this.binList = this.warehouseList[0].Locations;
            this.prefs.setPreference('warehouse', this.warehouseList[0].WarehouseID.value, true);
        }

        // Generate index for quick lookup
        this.binIndex = {};
        for (let bin of this.binList){
            this.binIndex[bin.LocationID.value] = bin;
        }
    }

    public initialLoad() {
        return new Promise((resolve, reject) => {
            this.api.getWarehouseList().then((warehouseList : any) => {

                this.warehouseList = warehouseList;

                this.generateBinList();

                this.api.getItemList().then((itemList) => {

                    this.itemList = itemList;

                    resolve();

                }).catch((err) => {
                    reject(err);
                });

            }).catch((err) => {
                reject(err);
            });
        });
    }

}
