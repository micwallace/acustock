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

    itemList = null;
    binList = null;
    binIndex = null;
    itemIndex = {};
    binPickSequence = [];
    warehouseList = null;

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

    public getItemById(id) {

        return new Promise((resolve, reject)=> {

            if (this.itemIndex.hasOwnProperty(id))
                return resolve(this.itemIndex[id]);

            // TODO: Optimise by only fetching the requested item.
            this.getItemList().then((itemList:any)=> {

                for (var i = 0; i < itemList.length; i++) {

                    if (itemList[i].InventoryID.value == id) {

                        this.itemIndex[id] = itemList[i];
                        resolve(itemList[i]);
                        return;
                    }


                    for (var x = 0; x < itemList[i].CrossReferences.length; x++) {

                        if (itemList[i].CrossReferences[x].AlternateID.value == id) {

                            this.itemIndex[id] = itemList[i];
                            resolve(itemList[i]);
                            return;
                        }

                    }
                }

                reject({message: "The item with ID " + id + " was not found."});

                // TODO: Perform fresh lookup on cache expiry

            }).catch((err)=> {
                reject(err);
            })
        });
    }

    public getItemWarehouseDetails(item){

        var warehouse = this.getCurrentWarehouse();

        if (item.WarehouseDetails != null){
            for (var i=0; i<item.WarehouseDetails.length; i++){
                if (warehouse.WarehouseID.value == item.WarehouseDetails[i].WarehouseID.value){
                    return item.WarehouseDetails[i];
                }
            }
        }

        return null;
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

    public initialLoad() {
        return new Promise((resolve, reject) => {
            var toast = this.toastCtrl.create({
                message: 'Initial cache load in progress. Some operations will be slower until this completes.',
                showCloseButton: true,
                closeButtonText: "OK"
            });
            toast.present();

            this.api.getWarehouseList().then((warehouseList:any) => {

                this.warehouseList = warehouseList;

                this.generateBinList();

                this.api.getItemList().then((itemList) => {

                    this.itemList = itemList;

                    resolve();
                    toast.setMessage('Initial load complete.');
                    setTimeout(()=> {
                        toast.dismissAll();
                    }, 3000);
                    console.log("Initial data loaded.")
                }).catch((err) => {
                    reject(err);
                    this.loadFailed(toast, err);
                });

            }).catch((err) => {
                reject(err);
                this.loadFailed(toast, err);
            });
        });
    }

    private loadFailed(toast, err) {
        toast.setMessage('Initial load failed: ' + err.message);
        setTimeout(()=> {
            toast.dismissAll();
        }, 3000);
        console.log("Initial data load failed: " + err.message);
    }

}
