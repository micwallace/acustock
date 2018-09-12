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

    public getItemList() {

        return new Promise((resolve, reject) => {

            if (this.itemList == null) {
                this.primeItemCache().then((res) => {
                    resolve(this.itemList);
                }).catch((err) => {
                    reject(err);
                });
                return;
            }

            resolve(this.itemList);
        });
    }

    public getItemById(id) {

        return new Promise((resolve, reject)=> {

            // TODO: Perform fresh lookup on cache expiry

            if (this.itemIndex.hasOwnProperty(id))
                return resolve(this.itemIndex[id]);

            for (var i = 0; i < this.itemList.length; i++) {

                if (this.itemList[i].InventoryID.value == id) {

                    this.itemIndex[id] = this.itemList[i];
                    resolve(this.itemList[i]);
                    return;
                }


                for (var x = 0; x < this.itemList[i].CrossReferences.length; x++) {

                    if (this.itemList[i].CrossReferences[x].AlternateID.value == id) {

                        this.itemIndex[id] = this.itemList[i];
                        resolve(this.itemList[i]);
                        return;
                    }

                }
            }

            if (this.itemCachePrimed)
                reject({message: "The item with ID " + id + " was not found."});

            this.api.itemLookup(id).then((res:any)=> {

                if (res.Results.length == 0){
                    reject({message: "An item with ID " + id + " was not found."});
                    return;
                }

                var inventoryId = res.Results[0].InventoryID.value;

                this.api.getItem(inventoryId).then((item:any)=> {

                    this.itemList.push(item);
                    this.itemIndex[id] = item;
                    resolve(item);

                }).catch((err)=> {

                    if (err.status == 404) {
                        reject({message: "Item lookup succeeded but failed to load the item data."});
                        return;
                    }

                    reject(err);
                })

            }).catch((err)=> {
                reject(err);
            });

        });
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

            if (this.binIndex && this.binIndex.hasOwnProperty(id)) {
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

        this.binList = warehouse.Locations;

        // Order for pick sequencing
        this.binList.sort((a, b)=> {
            return (a.Zone.value ? a.Zone.value.localeCompare(b.Zone.value) : 0) ||
                (a.PickingOrder.value > b.PickingOrder.value ? 1 : -1) ||
                (a.LocationID.value ? a.LocationID.value.localeCompare(b.LocationID.value) : 0);
        });

        // Generate index for quick lookup
        this.binIndex = {};
        for (let bin of this.binList) {
            this.binIndex[bin.LocationID.value] = bin;
        }
    }

    public getLocationItems(locationId){
        return new Promise((resolve, reject)=>{

            if (this.locationItems.hasOwnProperty(locationId))
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

                resolve(this.itemLocations[itemId]);

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

    public flushItemLocationCache(){
        this.itemLocations = {};
        this.locationItems = {};
    }

    public initialLoad() {

        var toast = this.toastCtrl.create({
            message: 'Initial cache load in progress. Some operations will be slower until this completes.',
            showCloseButton: true,
            closeButtonText: "OK"
        });
        toast.present();

        if (this.warehouseList != null){

            this.primeItemCache().then(()=>{
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

                this.primeItemCache().then(()=>{
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
    }

    private loadFailed(toast, err) {
        toast.setMessage('Initial load failed: ' + err.message);
        setTimeout(()=> {
            toast.dismissAll();
        }, 3000);
        console.log("Initial data load failed: " + err.message);
    }

    private primeItemCache(){

        return new Promise((resolve, reject)=>{

            var cachePref = this.prefs.getPreference("cache_prime_items");

            if (cachePref == "none")
                return resolve();

            if (cachePref == "full") {
                this.api.getItemList().then((itemList) => {
                    this.itemList = itemList;
                    this.itemCachePrimed = true;
                    resolve();
                }).catch((err) => {
                    reject(err);
                });
            } else {
                this.itemList = [];
                this.batchLoadItems(resolve, reject);
            }
        });
    }

    private batchLoadItems(resolve, reject, skip=0, limit=200){

        this.api.getItemList("$expand=CrossReferences&$expand=WarehouseDetails&$top=" + limit + (skip>0 ? "&$skip="+skip : "")).then((itemList:any) => {

            this.itemList = this.itemList.concat(itemList);

            if (itemList.length < limit){
                resolve();
                this.itemCachePrimed = true;
                console.log("Item batch load "+skip+" to "+(skip+itemList.length)+" completed");
            } else {
                console.log("Item batch load "+skip+" to "+(skip+limit)+" completed");
                skip += limit;
                this.batchLoadItems(resolve, reject, skip);
            }
        }).catch((err) => {
            reject(err);
        });
    }

    private loadWarehouseList(){

        return new Promise((resolve, reject)=>{

            this.api.getWarehouseList().then((warehouseList:any) => {

                this.warehouseList = warehouseList;
                this.generateBinList();

                resolve();

            }).catch((err)=>{
                reject(err);
            });

        });
    }
}
