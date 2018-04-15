import { Injectable } from '@angular/core';
import { Api } from '../../providers/api/api'
import { CacheProvider } from '../../providers/cache/cache'
import { LoadingController } from 'ionic-angular';
import { PreferencesProvider } from "../preferences/preferences";

/*
 Generated class for the PickProvider provider.

 See https://angular.io/guide/dependency-injection for more info on providers
 and Angular DI.
 */
@Injectable()
export class PickProvider {

    public currentShipment;

    public unpickedItems = [];

    public pickedItems = [];

    public savedPicks = null;

    constructor(public api:Api, public cache:CacheProvider, public loadingCtrl:LoadingController, public prefs: PreferencesProvider) {
        console.log('Hello PickProvider Provider');
    }

    public loadShipment(shipmentNbr) {

        return new Promise((resolve, reject)=> {

            if (!shipmentNbr) {
                alert("Please enter a valid shipment number");
                resolve(false);
                return;
            }

            let loader = this.loadingCtrl.create({content: "Loading..."});
            loader.present();

            this.api.getShipment(shipmentNbr).then((res:any) => {

                loader.dismiss();

                if (res.length == 0) {
                    alert("Shipment #" + shipmentNbr + " was not found in the system.");
                    resolve(false);
                    return;
                }

                let shipment = res[0];

                // TODO add warehouse check
                var curWarehouse = this.prefs.getPreference('warehouse');
                if (shipment.WarehouseID.value !== curWarehouse) {
                    alert("Shipment #" + shipmentNbr + " was found but belongs to warehouse " + shipment.WarehouseID.value + ", not the currently selected warehouse which is " + curWarehouse);
                    resolve(false);
                    return;
                }

                this.currentShipment = shipment;

                for (var i = 0; i < this.currentShipment.Details.length; i++) {

                    var item = this.currentShipment.Details[i];

                    if (item.LocationID.value == "SHIPPING")
                        continue;

                    var unpicked = Object.assign({}, item);
                    unpicked.Allocations = [];
                    unpicked.PickedQty = 0;

                    for (var x = 0; x < item.Allocations.length; x++) {
                        // TODO: get current warehouse shipping location
                        if (item.Allocations[x].LocationID.value !== "SHIPPING") {
                            unpicked.Allocations.push(item.Allocations[x]);
                        } else {
                            unpicked.PickedQty += item.ShippedQty.value;
                        }
                    }

                    if (unpicked.Allocations.length > 0) {
                        this.unpickedItems.push(unpicked);
                    }
                }

                // load saved picks
                var picks = JSON.parse(localStorage.getItem("unconfirmed_picks"));

                var id = this.currentShipment.ShipmentNbr.value;

                if (picks && picks.hasOwnProperty(id)) {
                    this.savedPicks = picks[id];

                    console.log("Found saved picks");
                } else {
                    this.savedPicks = null;
                }

                resolve(true);

            }).catch((err) => {
                loader.dismiss();
                alert(err.message);
                resolve(false);
            });
        });

    }

    /*private getPickedItem(itemId){
     for (let item of this.pickedItems){
     if (itemId == item.InventoryID.value){
     return item;
     }
     }
     return null;
     }*/

    getItemByIndex(index) {

        if (this.unpickedItems.length == 0 || index >= this.unpickedItems.length)
            return null;

        return this.unpickedItems[index];
    }

    getAllocationByIndex(itemIndex, allocIndex) {

        if (this.unpickedItems.length == 0 ||
            itemIndex >= this.unpickedItems.length ||
            allocIndex >= this.unpickedItems[itemIndex].Allocations.length)
            return null;

        return this.unpickedItems[itemIndex].Allocations[allocIndex];
    }

    getItemPickedQty(index) {
        if (this.unpickedItems.length == 0 || index >= this.unpickedItems.length)
            return 0;

        var picked = this.unpickedItems[index].PickedQty;
        var itemId = this.unpickedItems[index].InventoryID.value;

        // add uncommitted picks
        for (let item of this.pickedItems) {
            if (itemId == item.InventoryID.value) {
                for (let allocation of item.Allocations) {
                    picked += allocation.Qty.value;
                }
                break;
            }
        }

        return picked;
    }

    public addPick(itemIndex, allocationIndex, data) {
        // check for existing item
        var found = false;

        for (let item of this.pickedItems) {
            if (data.itemLineNbr == item.LineNbr.value) {

                item.Allocations.push(data);
                found = true;
                break;
            }
        }

        if (!found) {
            for (let item of this.unpickedItems) {
                if (data.itemLineNbr == item.LineNbr.value) {

                    var pickedItem = Object.assign({}, item);

                    pickedItem.Allocations = [data];
                    this.pickedItems.push(pickedItem);
                    break;
                }
            }
        }

        // If the whole qty is picked remove the item from the unpicked list, otherwise move to the next suggested allocation if one exists
        if (this.getItemPickedQty(itemIndex) < this.getItemByIndex(itemIndex).ShippedQty.value) {
            // TODO: check if suggested allocations have become exhausted.

            if (data.hasOwnProperty('lineNbr')) {

                console.log("Is suggesed allocation");

                var curAllocation = this.getAllocationByIndex(itemIndex, allocationIndex);

                if (data.Qty.value >= curAllocation.Qty.value) {

                    this.unpickedItems[itemIndex].Allocations.splice(allocationIndex, 1);

                    console.log("Allocation fulfilled, moving to next.");

                } else {
                    this.unpickedItems[itemIndex].Allocations[allocationIndex].Qty.value = parseInt(curAllocation.Qty.value) - data.Qty.value;

                    console.log("Removing qty from allocation");
                }

            } else {

                console.log("Not suggested allocations");
                // TODO: perform server validation & remove qty from left over allocations
            }

            this.savePicks();

            return false;
        } else {

            this.unpickedItems.splice(itemIndex, 1);

            this.savePicks();
            // indicate that the item has been fully picked
            return true;
        }
    }

    public savePicks() {
        var picks = JSON.parse(localStorage.getItem("unconfirmed_picks"));

        if (!picks)
            picks = {};

        picks[this.currentShipment.ShipmentNbr.value] = {
            unpickedItems: this.unpickedItems,
            pickedItems: this.pickedItems
        };

        localStorage.setItem("unconfirmed_picks", JSON.stringify(picks));

        console.log("Picks saved");
    }

    public hasSavedPicks() {
        return this.savedPicks != null;
    }

    public loadSavedPicks() {
        this.unpickedItems = this.savedPicks.unpickedItems;
        this.pickedItems = this.savedPicks.pickedItems;
    }

    public clearSavedPicks() {
        var picks = JSON.parse(localStorage.getItem("unconfirmed_picks"));

        if (!picks)
            return;

        delete picks[this.currentShipment.ShipmentNbr.value];

        localStorage.setItem("unconfirmed_picks", JSON.stringify(picks));

        this.savedPicks = null;
    }

    public confirmPicks() {

    }


}
