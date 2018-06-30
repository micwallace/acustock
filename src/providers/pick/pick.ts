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

    //public shipmentIndex = {}; // index current shipment by keys for easy modification of current object

    public pickList = [];

    public remainingItems = {};

    public pendingPicks = {};

    //public pickedItems = [];

    public savedPicks = null;

    public totalQty = 0;

    public unpickedQty = 0;

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

                //console.log(JSON.stringify(res));

                loader.dismiss();

                if (res.length == 0) {
                    alert("Shipment #" + shipmentNbr + " was not found in the system.");
                    resolve(false);
                    return;
                }

                let shipment = res[0];

                var curWarehouse = this.prefs.getPreference('warehouse');
                if (shipment.WarehouseID.value !== curWarehouse) {
                    alert("Shipment #" + shipmentNbr + " was found but belongs to warehouse " + shipment.WarehouseID.value + ", not the currently selected warehouse which is " + curWarehouse);
                    resolve(false);
                    return;
                }

                this.currentShipment = shipment;

                this.generatePickList();

                // load saved picks
                var picks = JSON.parse(localStorage.getItem("unconfirmed_picks"));

                var id = this.currentShipment.ShipmentNbr.value;

                if (picks && picks.hasOwnProperty(id)) {
                    this.savedPicks = picks[id];
                    // TODO: Remove completed
                    console.log("Found saved picks");
                } else {
                    this.savedPicks = null;
                }

                this.calculateQtys();

                resolve(true);

            }).catch((err) => {
                loader.dismiss();
                alert(err.message);
                resolve(false);
            });
        });

    }

    generatePickList(){

        var pickList = {};
        this.remainingItems = {};

        for (var i = 0; i < this.currentShipment.Details.length; i++) {

            var item = this.currentShipment.Details[i];

            if (item.PickedQty.value == item.ShippedQty.value)
                continue;

            /*var unpicked = Object.assign({}, item);
             unpicked.Allocations = [];
             unpicked.PickedQty = 0;*/
            var inventoryId = item.InventoryID.value;

            if (!this.remainingItems.hasOwnProperty(inventoryId))
                this.remainingItems[inventoryId] = 0;

            var totalQty = item.ShippedQty.value;
            var allocatedQty = 0;

            for (var x = 0; x < item.Allocations.length; x++) {

                // TODO: get current warehouse shipping location
                /*if (item.Allocations[x].LocationID.value !== "SHIPPING") {
                 unpicked.Allocations.push(item.Allocations[x]);
                 } else {
                 unpicked.PickedQty += item.ShippedQty.value;
                 }*/
                var pickItem = item.Allocations[x];

                allocatedQty += pickItem.Qty.value;

                if (pickItem.PickedQty.value == pickItem.Qty.value)
                    continue;

                var location = pickItem.LocationID.value;

                if (!pickList.hasOwnProperty(location))
                    pickList[location] = {
                        LocationID: {value: location},
                        Items: []
                    };

                var remaining = pickItem.Qty.value - pickItem.PickedQty.value;

                pickItem.RemainingQty = remaining;
                pickItem.InventoryID = item.InventoryID;
                pickItem.ShippedQty = item.ShippedQty;
                pickItem.TotalPickedQty = item.PickedQty;

                this.remainingItems[inventoryId] += remaining;

                pickList[location].Items.push(pickItem);
            }

            // add unallocated total to remaining qty
            var unallocated = totalQty - allocatedQty;
            if (unallocated > 0) {

                this.remainingItems[inventoryId] += unallocated;

                if (!pickList.hasOwnProperty("UNALLOCATED"))
                    pickList["UNALLOCATED"] = {
                        LocationID: {value: ""},
                        Items: []
                    };

                pickList["UNALLOCATED"].Items.push({
                    InventoryID: item.InventoryID,
                    Description: item.Description,
                    SplitLineNbr: item.LineNbr,
                    LocationID: {value: ""},
                    LotSerialNbr: {value: ""},
                    Qty: {value: unallocated},
                    PickedQty: {value: 0},
                    RemainingQty: unallocated,
                    ShippedQty: item.ShippedQty,
                    TotalPickedQty: item.PickedQty,
                });
            }

        }

        // convert picklist to array and sort by picking order

        this.pickList = [];

        for (i in pickList){
            this.pickList.push(pickList[i]);
        }

        var binOrder = this.cache.binPickSequence;

        this.pickList.sort((a, b)=>{
            return (binOrder.indexOf(a[0]) < binOrder.indexOf(b[0])) ? 1 : -1;
        });

        console.log(JSON.stringify(this.pickList));

    }

    calculateQtys(){

        this.totalQty = 0;
        var pickedQty = 0;

        for (var i=0; i<this.currentShipment.Details.length; i++){

            var item = this.currentShipment.Details[i];
            this.totalQty += item.ShippedQty.value;
            pickedQty += item.PickedQty.value;
        }

        // add uncommitted picks
        for (var x in this.pendingPicks) {
            pickedQty += this.pendingPicks[x].PendingQty;
        }

        this.unpickedQty = this.totalQty - pickedQty;
    }

    /*private getPickedItem(itemId){
     for (let item of this.pickedItems){
     if (itemId == item.InventoryID.value){
     return item;
     }
     }
     return null;
     }*/

    getSuggestedLocation(index) {

        if (this.pickList.length == 0 || index >= this.pickList.length)
            return null;

        return this.pickList[index];
    }

    getSuggestedItem(locIndex, allocIndex) {

        if (this.pickList.length == 0 ||
            locIndex >= this.pickList.length ||
            allocIndex >= this.pickList[locIndex].Items.length)
            return null;

        return this.pickList[locIndex].Items[allocIndex];
    }

    getPendingPickedQty(item) {

        var key = item.SplitLineNbr.value + "/" + item.LineNbr.value;

        if (this.pendingPicks.hasOwnProperty(key))
            return this.pendingPicks[key].PendingQty;

        return 0;
    }

    getTotalPickedQty(item){
        return item.TotalPickedQty.value + this.getPendingPickedQty(item);
    }

    /*public addPick(itemIndex, allocationIndex, data) {
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
    }*/

    public savePicks() {
        var picks = JSON.parse(localStorage.getItem("unconfirmed_picks"));

        if (!picks)
            picks = {};

        picks[this.currentShipment.ShipmentNbr.value] = this.pendingPicks;

        localStorage.setItem("unconfirmed_picks", JSON.stringify(picks));

        console.log("Picks saved");
        this.calculateQtys();
    }

    public hasSavedPicks() {
        return this.savedPicks != null;
    }

    public loadSavedPicks() {
        this.pendingPicks = this.savedPicks;
        this.calculateQtys();
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
