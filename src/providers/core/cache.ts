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

import { Injectable } from '@angular/core';
import { Api } from "./api";
import { PreferencesProvider } from "./preferences";
import { ToastController } from "ionic-angular";

/*
 Generated class for the CacheProvider provider.

 See https://angular.io/guide/dependency-injection for more info on providers
 and Angular DI.
 */
@Injectable()
export class CacheProvider {

    itemList = [];
    binList = null;

    binIndex = null;
    itemIndex = {};

    itemCachePrimed = false;

    binPickSequence = [];

    warehouseList = null;

    locationItems = {};
    itemLocations = {};

    locationCacheTs = 0;
    itemCacheTs = 0;

    constructor(public api:Api, public prefs:PreferencesProvider, public toastCtrl:ToastController) {
        console.log('Hello CacheProvider Provider');
    }

    public getCurrentWarehouse() {

        for (var i = 0; i < this.warehouseList.length; i++) {
            if (this.warehouseList[i].WarehouseID.value == this.prefs.getPreference('warehouse')) {
                return this.warehouseList[i];
            }
        }

        // Warehouse not found, default to first loaded warehouse
        if (this.warehouseList != null && this.warehouseList.length > 0) {
            this.prefs.setPreference('warehouse', this.warehouseList[0].WarehouseID.value, true);
            return this.warehouseList[0];
        }

        return null;
    }

    public getItemById(id, includeWhDetails=false) {

        return new Promise((resolve, reject)=> {

            if (this.itemIndex.hasOwnProperty(id)) {

                // Fetch data if item warehouse details are required and null or if cache expiry has been exceeded
                if ((includeWhDetails && this.itemIndex[id].WarehouseDetails == null) ||
                    new Date().getTime() > (this.itemIndex[id].cache_ts + (this.prefs.getPreference("cache_expiry") * 1000))){

                    this.loadItemData(this.itemIndex[id].InventoryID.value, resolve, reject);
                    return;
                } else {
                    return resolve(this.itemIndex[id]);
                }
            }

            // Only perform a fresh lookup if cache isn't primed or cache expiry has been exceeded
            if (this.itemCachePrimed &&
                new Date().getTime() < (this.itemCacheTs + (this.prefs.getPreference("cache_expiry") * 1000)))
                reject({message: "The item with ID " + id + " was not found."});

            this.api.itemLookup(id).then((res:any)=> {

                if (res.Results.length == 0){
                    reject({message: "An item with ID " + id + " was not found."});
                    return;
                }

                this.loadItemData(res.Results[0].InventoryID.value, resolve, reject);

            }).catch((err)=> {
                reject(err);
            });

        });
    }

    private loadItemData(inventoryId, resolve, reject){

        this.api.getItem(inventoryId).then((item:any)=> {

            if (item.ItemStatus.value === "Inactive"){
                reject({message: "An item with ID " + inventoryId + " (" + inventoryId + ") was found but is inactive."});
                return;
            }

            item.cache_ts = new Date().getTime();
            item.Description.value = item.Description.value ? item.Description.value : "";

            this.addItemToIndex(item);

            this.itemList.push(item);

            resolve(item);

        }).catch((err)=> {

            if (err.status == 404) {
                reject({message: "Item lookup succeeded but failed to load the item data."});
                return;
            }

            reject(err);
        })

    }

    public getItemWarehouseDetails(item) {

        var warehouse = this.getCurrentWarehouse();

        if (item.WarehouseDetails != null) {
            for (var i = 0; i < item.WarehouseDetails.length; i++) {
                if (warehouse.WarehouseID.value == item.WarehouseDetails[i].WarehouseID.value) {
                    return item.WarehouseDetails[i];
                }
            }
        }

        return null;
    }

    public getWarehouseList() {

        return new Promise((resolve, reject) => {

            if (this.warehouseList == null) {
                this.loadWarehouseList().then(() => {
                    resolve(this.warehouseList);
                }).catch((err) => {
                    reject(err);
                });
                return;
            }

            resolve(this.warehouseList);
        });
    }

    public getBinList() {

        return new Promise((resolve, reject) => {

            if (this.binList == null) {
                this.loadWarehouseList().then(() => {
                    resolve(this.binList);
                }).catch((err) => {
                    reject(err);
                });
                return;
            }

            resolve(this.binList);
        });
    }

    public getBinById(id) {
        return new Promise((resolve, reject)=> {

            // Return cached data if it exists and expiry has not been exceeded
            if (this.binIndex && this.binIndex.hasOwnProperty(id) &&
                new Date().getTime() < (this.locationCacheTs + (this.prefs.getPreference("cache_expiry") * 1000))) {

                resolve(this.binIndex[id]);
                return;
            }

            // TODO: optimise so that two bin loads can't be happening at the same time.
            this.getBinList().then((binList:any)=> {

                if (this.binIndex.hasOwnProperty(id)) {
                    resolve(this.binIndex[id]);
                    return;
                }

                var warehouse = this.getCurrentWarehouse();
                var warehouseName = warehouse ? (warehouse.Description.value ? warehouse.Description.value : warehouse.WarehouseID.value) : "Unknown";

                reject({message: "No location found with ID " + id + " in warehouse " + warehouseName});

                // TODO: Perform fresh lookup on cache expiry
            }).catch((err) => {
                reject(err);
            });
        });
    }

    public generateBinList() {
        var warehouse = this.getCurrentWarehouse();

        if (!warehouse)
            return;

        this.binList = [];

        for (let loc of warehouse.Locations){
            loc.Description.value = loc.Description.value ? loc.Description.value : "";
            this.binList.push(loc);
        }

        // Order for pick sequencing
        this.binList.sort((a, b)=> {

            if (!a.Zone.value)
                a.Zone.value = "";

            if (!b.Zone.value)
                b.Zone.value = "";

            if (a.Zone.value != b.Zone.value)
                return a.Zone.value.localeCompare(b.Zone.value);

            if (a.PickingOrder.value != b.PickingOrder.value)
                return (a.PickingOrder.value < b.PickingOrder.value ? -1 : 1);

            return a.LocationID.value.localeCompare(b.LocationID.value);
        });

        // Generate index for quick lookup
        this.binIndex = {};
        this.binPickSequence = [];
        for (let bin of this.binList) {
            this.binPickSequence.push(bin.LocationID.value);
            this.binIndex[bin.LocationID.value] = bin;
        }
    }

    public getLocationItems(locationId, noCache=false){
        return new Promise((resolve, reject)=>{

            if (!noCache && this.locationItems.hasOwnProperty(locationId))
                return resolve(this.locationItems[locationId]);

            this.api.getLocationContents(locationId, this.prefs.getPreference('warehouse')).then((itemList:any)=> {

                // Index current items for easier validation
                this.locationItems[locationId] = {};

                for (let item of itemList) {
                    this.locationItems[locationId][item.InventoryID.value] = item;
                }

                resolve(this.locationItems[locationId]);

            }).catch((err) => {
                reject(err);
            });
        });
    }

    public getItemLocations(itemId){
        return new Promise((resolve, reject)=>{

            if (this.itemLocations.hasOwnProperty(itemId))
                return resolve(this.itemLocations[itemId]);

            this.api.getItemWarehouseLocations(itemId, this.prefs.getPreference('warehouse')).then((locationList:any)=> {

                console.log("Loading item locations: " + itemId);

                // Index current items for easier validation
                this.itemLocations[itemId] = {};

                for (let item of locationList) {
                    this.itemLocations[itemId][item.Location.value] = item;
                }

                this.getBinList().then((bins:any)=>{

                    for (let bin of bins){
                        if (this.itemLocations[itemId].hasOwnProperty(bin.LocationID.value))
                            this.itemLocations[itemId][bin.LocationID.value].LocDescription = bin.Description.value;
                    }

                    resolve(this.itemLocations[itemId]);

                }).catch((err)=>{
                    reject(err);
                });

            }).catch((err) => {
                reject(err);
            });
        });
    }

    public preloadItemLocations(itemIds:Array<string>, curIndex=0){

        this.getItemLocations(itemIds[curIndex]).then(()=>{

            curIndex++;

            if (curIndex < itemIds.length)
                this.preloadItemLocations(itemIds, curIndex);

        }).catch((err)=>{
            console.log("Item locations preload failed");
        });
    }

    public flushItemLocationCache(key=null){
        if (key != null){
            if (this.itemLocations.hasOwnProperty(key)){
                delete this.itemLocations[key];
            } else if (this.locationItems.hasOwnProperty(key)){
                delete this.locationItems[key];
            }
        } else {
            this.itemLocations = {};
            this.locationItems = {};
        }

    }

    public initialLoad() {

        var toast = this.toastCtrl.create({
            message: 'Priming cache: locations...',
            showCloseButton: true,
            closeButtonText: "OK"
        });
        toast.present();

        if (this.warehouseList != null){

            toast.setMessage('Priming cache: items...');

            this.primeItemCache(toast).then(()=>{
                toast.setMessage('Initial load complete.');
                setTimeout(()=> {
                    toast.dismissAll();
                }, 3000);
                console.log("Initial data loaded.");
            }).catch((err) => {
                this.loadFailed(toast, err);
            });

        } else {

            this.loadWarehouseList().then(()=>{

                toast.setMessage('Priming cache: items...');

                this.primeItemCache(toast).then(()=>{
                    toast.setMessage('Initial load complete.');
                    setTimeout(()=> {
                        toast.dismissAll();
                    }, 3000);
                    console.log("Initial data loaded.");
                }).catch((err) => {
                    this.loadFailed(toast, err);
                });

            }).catch((err) => {
                this.loadFailed(toast, err);
            });
        }

        setInterval(()=>{ this.primeItemCache(); }, (this.prefs.getPreference("cache_refresh_items") * 1000));
    }

    private loadFailed(toast, err) {
        toast.setMessage('Initial load failed: ' + err.message);
        setTimeout(()=> {
            toast.dismissAll();
        }, 3000);
        console.log("Initial data load failed: " + err.message);
    }

    private primeItemCache(toast=null){

        return new Promise((resolve, reject)=>{

            var cachePref = this.prefs.getPreference("cache_prime_items");

            if (cachePref == "none")
                return resolve();

            if (cachePref == "full") {

                var warehouseDetPref = this.prefs.getPreference("cache_item_warehouse");

                this.api.getItemList("$expand=CrossReferences" + (warehouseDetPref == "withitems" ? ",WarehouseDetails" : "") + "&$filter=ItemStatus ne 'Inactive'").then((itemList:any) => {

                    var ts = new Date().getTime();

                    for (var item of itemList){
                        item.cache_ts = ts;
                        item.Description.value = item.Description.value ? item.Description.value : "";
                        this.addItemToIndex(item);
                    }

                    this.itemList = itemList;
                    this.itemCachePrimed = true;
                    this.itemCacheTs = ts;
                    resolve();
                }).catch((err) => {
                    reject(err);
                });
            } else {
                this.itemList = [];
                this.batchLoadItems(resolve, reject, toast);
            }
        });
    }

    private addItemToIndex(item){

        this.itemIndex[item.InventoryID.value] = item;

        for (var x = 0; x < item.CrossReferences.length; x++) {

            this.itemIndex[item.CrossReferences[x].AlternateID.value] = item;
        }
    }

    private batchLoadItems(resolve, reject, toast, skip=0, limit=100){

        var warehouseDetPref = this.prefs.getPreference("cache_item_warehouse");

        var queryStr = "$expand=CrossReferences" + (warehouseDetPref == "withitems" ? ",WarehouseDetails" : "") + "&$filter=ItemStatus ne 'Inactive'&$top=" + limit + (skip>0 ? "&$skip="+skip : "");

        this.api.getItemList(queryStr).then((itemList:any) => {

            var ts = new Date().getTime();

            for (var item of itemList){
                item.cache_ts = ts;
                item.Description.value = item.Description.value ? item.Description.value : "";
                this.addItemToIndex(item);
            }

            this.itemList = this.itemList.concat(itemList);

            if (itemList.length < limit){

                resolve();
                this.itemCachePrimed = true;
                this.itemCacheTs = ts;

                console.log("Item batch load "+skip+" to "+(skip+itemList.length)+" completed");
            } else {

                skip += limit;
                this.batchLoadItems(resolve, reject, toast, skip);

                if (toast != null)
                    toast.setMessage('Priming cache: items ('+ skip +')...');

                console.log("Item batch load "+skip+" to "+(skip+limit)+" completed");
            }
        }).catch((err) => {
            reject(err);
        });
    }

    private loadWarehouseList(){

        return new Promise((resolve, reject)=>{

            this.api.getWarehouseList().then((warehouseList:any) => {

                this.locationCacheTs = new Date().getTime();

                this.warehouseList = warehouseList;
                this.generateBinList();

                resolve();

            }).catch((err)=>{
                reject(err);
            });

        });
    }
}
