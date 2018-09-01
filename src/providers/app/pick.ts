import { Injectable } from '@angular/core';
import { Api } from '../core/api'
import { CacheProvider } from '../core/cache'
import { LoadingController } from 'ionic-angular';
import { PreferencesProvider } from "../core/preferences";

/*
 Generated class for the PickProvider provider.

 See https://angular.io/guide/dependency-injection for more info on providers
 and Angular DI.
 */
@Injectable()
export class PickProvider {

    public currentShipment;

    public sourceIndex = {};

    private modifiedAllocations = {};

    public pickList = [];

    public pendingPicks = {};

    public savedPicks = null;

    public totalQty = 0;

    public unpickedQty = 0;

    public pendingQty = 0;

    constructor(public api:Api, public cache:CacheProvider, public loadingCtrl:LoadingController, public prefs:PreferencesProvider) {
        console.log('Hello PickProvider Provider');
    }

    public loadShipment(shipmentNbr) {

        return new Promise((resolve, reject)=> {

            if (!shipmentNbr) {
                reject({message:"Please enter a valid shipment number"});
                return;
            }

            this.api.getShipment(shipmentNbr).then((res:any) => {

                let shipment = res;

                if (shipment.Operation.value == "Receipt"){
                    reject({message:"Shipment #" + shipmentNbr + " was found but is a receipt shipment and cannot be picked."});
                    return;
                }

                var curWarehouse = this.prefs.getPreference('warehouse');
                if (shipment.WarehouseID.value !== curWarehouse) {
                    reject({message:"Shipment #" + shipmentNbr + " was found but belongs to warehouse " + shipment.WarehouseID.value + ", not the currently selected warehouse which is " + curWarehouse});
                    return;
                }

                this.currentShipment = shipment;

                this.pendingPicks = {};

                this.generateSourceList();

                this.calculateQtys();

                // load saved picks
                var picks = JSON.parse(localStorage.getItem("unconfirmed_picks"));

                var id = this.currentShipment.ShipmentNbr.value;

                if (picks && picks.hasOwnProperty(id)) {
                    this.savedPicks = picks[id];
                } else {
                    this.savedPicks = null;
                }

                resolve(true);

            }).catch((err) => {

                if (err.status == 404)
                    err.message = "Shipment #" + shipmentNbr + " was not found in the system.";

                console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));

                reject(err);
            });
        });

    }

    public refreshStatus(){

        return new Promise((resolve, reject)=> {

            this.api.getShipment(this.currentShipment.ShipmentNbr.value, null).then((res:any)=>{
                this.currentShipment.PickStatus = res.PickStatus;
                this.currentShipment.PickDevice = res.PickDevice;

                resolve();
            }).catch((err)=>{
                reject(err);
            });
        });
    }

    public assignShipment(){

        return new Promise((resolve, reject)=> {

            var data = {
                ShipmentNbr: this.currentShipment.ShipmentNbr,
                PickStatus: {value: "2"},
                PickDevice: {value: this.prefs.getPreference("device")}
            };

            this.api.putShipment(data, null).then((res:any)=>{
                this.currentShipment.PickStatus = res.PickStatus;
                this.currentShipment.PickDevice = res.PickDevice;

                resolve();
            }).catch((err)=>{
                reject(err);
            });
        });
    }

    generateSourceList(){

        this.sourceIndex = {};

        for (var i = 0; i < this.currentShipment.Details.length; i++) {

            var item = this.currentShipment.Details[i];

            if (item.PickedQty.value >= item.ShippedQty.value)
                continue;

            /*var unpicked = Object.assign({}, item);
             unpicked.Allocations = [];
             unpicked.PickedQty = 0;*/

            var totalQty = item.ShippedQty.value;
            var allocatedQty = 0;

            var shipmentLine = item.LineNbr.value;

            for (var x = 0; x < item.Allocations.length; x++) {

                var shipmentAlloc = JSON.parse(JSON.stringify(item.Allocations[x]));

                /*var pending = this.getPendingAllocation(pickItem.LineNbr.value, pickItem.SplitLineNbr.value);

                 // Removed used allocations
                 if (pending != null && (pending.deleted || pending.PendingQty >= pickItem.RemainingQty))
                 continue;*/

                allocatedQty += shipmentAlloc.Qty.value;

                if (shipmentAlloc.PickedQty.value >= shipmentAlloc.Qty.value)
                    continue;

                if (!this.sourceIndex.hasOwnProperty(shipmentLine))
                    this.sourceIndex[shipmentLine] = {
                        InventoryID: item.InventoryID,
                        ShippedQty: {value: item.ShippedQty.value},
                        PickedQty: {value: item.PickedQty.value},
                        Allocations: {}
                    };

                shipmentAlloc.RemainingQty = shipmentAlloc.Qty.value - shipmentAlloc.PickedQty.value;
                shipmentAlloc.InventoryID = item.InventoryID;
                shipmentAlloc.ShippedQty = item.ShippedQty.value;
                shipmentAlloc.TotalPickedQty = item.PickedQty.value;
                shipmentAlloc.TotalRemainingQty = item.ShippedQty.value - item.PickedQty.value;

                this.sourceIndex[shipmentLine].Allocations[shipmentAlloc.SplitLineNbr.value] = shipmentAlloc;
            }

            // add unallocated quantity to the picklist
            var unallocated = totalQty - allocatedQty;
            if (unallocated > 0) {

                if (!this.sourceIndex.hasOwnProperty(shipmentLine))
                    this.sourceIndex[shipmentLine] = {
                        InventoryID: item.InventoryID,
                        ShippedQty: {value: item.ShippedQty.value},
                        PickedQty: {value: item.PickedQty.value},
                        Allocations: {}
                    };

                this.sourceIndex[shipmentLine].Allocations["UNALLOCATED"] = {
                    InventoryID: item.InventoryID,
                    Description: item.Description,
                    LineNbr: item.LineNbr,
                    LocationID: {value: ""},
                    LotSerialNbr: {value: ""},
                    Qty: {value: unallocated},
                    PickedQty: {value: 0},
                    RemainingQty: unallocated,
                    ShippedQty: item.ShippedQty,
                    TotalPickedQty: item.PickedQty,
                    TotalRemainingQty: item.ShippedQty.value - item.PickedQty.value
                };
            }

        }

        this.processPendingAllocations();

        this.generatePickList();

    }

    private processPendingAllocations(){

        console.log("Triming source index for allocations");
        this.modifiedAllocations = {};

        var srcAlloc, diff, pendingQty;

        for (var x in this.pendingPicks) {

            var pending = this.pendingPicks[x];

            console.log("Triming item: " + x);

            if (!this.sourceIndex.hasOwnProperty(x))
                continue;

            for (let alloc of pending.Allocations) {

                console.log("Triming allocation: ");
                console.log(JSON.stringify(alloc));

                // Consume the original allocation first if available, and then the rest until remaining pending qty is 0.
                pendingQty = alloc.PendingQty;

                if (alloc.hasOwnProperty("SplitLineNbr") && this.sourceIndex[x].Allocations.hasOwnProperty(alloc.SplitLineNbr.value)) {

                    srcAlloc = this.sourceIndex[x].Allocations[alloc.SplitLineNbr.value];

                    if (pendingQty < srcAlloc.RemainingQty) {

                        diff = srcAlloc.RemainingQty - pendingQty;

                        this.sourceIndex[x].Allocations[alloc.SplitLineNbr.value].RemainingQty = diff;
                        //this.sourceIndex[x].Allocations[alloc.SplitLineNbr.value].Qty.value = srcAlloc.Qty.value - pendingQty;

                        this.addModifiedAllocation(this.sourceIndex[x].Allocations[alloc.SplitLineNbr.value]);

                        console.log("Stage 1: Reduced remaining qty of current allocation " + pendingQty + " (remaining " + diff + ")");

                        pendingQty -= pendingQty;

                    } else {

                        delete this.sourceIndex[x].Allocations[alloc.SplitLineNbr.value];

                        pendingQty -= Math.min(srcAlloc.RemainingQty, pendingQty);

                        console.log("Stage 1: Deleted current allocation " + Math.min(srcAlloc.RemainingQty, pendingQty) + " (remaining " + pendingQty + ")");
                    }
                }

                if (pendingQty > 0) {

                    for (var y in this.sourceIndex[x].Allocations) {

                        srcAlloc = this.sourceIndex[x].Allocations[y];

                        if (pendingQty < srcAlloc.RemainingQty){

                            diff = srcAlloc.RemainingQty - pendingQty;

                            this.sourceIndex[x].Allocations[y].RemainingQty = diff;
                            this.sourceIndex[x].Allocations[y].Qty.value = srcAlloc.Qty.value - pendingQty;

                            this.addModifiedAllocation(this.sourceIndex[x].Allocations[y]);

                            console.log("Stage 2: Reduced remaining qty of other allocations "+ pendingQty + " (remaining "+ diff +")");

                            pendingQty -= diff;

                        } else {

                            this.sourceIndex[x].Allocations[y]["delete"] = true;
                            this.addModifiedAllocation(this.sourceIndex[x].Allocations[y]);

                            delete this.sourceIndex[x].Allocations[y];

                            pendingQty -= Math.min(srcAlloc.RemainingQty, pendingQty);

                            console.log("Stage 2: Deleted other allocation "+ Math.min(srcAlloc.RemainingQty, pendingQty) + " (remaining "+pendingQty+")");
                        }

                        if (pendingQty <= 0)
                            break;
                    }

                    if (this.sourceIndex[x].Allocations.length == 0)
                        delete this.sourceIndex[x];

                }
            }

        }

    }

    private addModifiedAllocation(alloc){

        if (!this.modifiedAllocations.hasOwnProperty(alloc.LineNbr.value)){
            this.modifiedAllocations[alloc.LineNbr.value] = {
                LineNbr: alloc.LineNbr,
                InventoryID: alloc.InventoryID,
                Allocations: {}
            };
        }

        console.log(alloc);

        this.modifiedAllocations[alloc.LineNbr.value].Allocations[alloc.SplitLineNbr.value] = alloc;
    }

    private generatePickList() {

        var pickList = {};

        for (var i in this.sourceIndex) {

            var item = this.sourceIndex[i];


            for (var x in item.Allocations) {

                var pickItem = item.Allocations[x];

                var location = pickItem.LocationID.value;

                if (!pickList.hasOwnProperty(location))
                    pickList[location] = {
                        LocationID: {value: location},
                        Items: []
                    };

                pickList[location].Items.push(pickItem);
            }

        }

        // convert picklist to array and sort by picking order
        this.pickList = [];

        for (var y in pickList) {
            this.pickList.push(pickList[y]);
        }

        var binOrder = this.cache.binPickSequence;

        this.pickList.sort((a, b)=> {
            return (binOrder.indexOf(a[0]) < binOrder.indexOf(b[0])) ? 1 : -1;
        });

    }

    calculateQtys() {

        this.totalQty = 0;
        this.pendingQty = 0;
        var pickedQty = 0;

        for (var i = 0; i < this.currentShipment.Details.length; i++) {

            var item = this.currentShipment.Details[i];
            this.totalQty += item.ShippedQty.value;
            pickedQty += item.PickedQty.value;
        }

        // add uncommitted picks
        for (var x in this.pendingPicks) {
            pickedQty += this.pendingPicks[x].PendingQty;
            this.pendingQty += this.pendingPicks[x].PendingQty;
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

    getBestFitAllocation(inventoryId, locationId){

        var bestAlloc = null;

        for (var i = 0; i < this.pickList.length; i++){

            for (var x = 0; x < this.pickList[i].Items.length; x++){

                var alloc = this.pickList[i].Items[x];

                if (alloc.InventoryID.value == inventoryId){

                    if (this.pickList[i].LocationID.value == locationId)
                        return [i, x];

                    // Use the first allocation if it's only an inventory ID match
                    if (bestAlloc == null)
                        bestAlloc = [i, x];
                }
            }
        }
    }

    getPendingItemQty(shipLineNbr) {

        if (this.pendingPicks.hasOwnProperty(shipLineNbr))
            return this.pendingPicks[shipLineNbr].PendingQty;

        return 0;
    }

    getPendingItem(shipLineNbr) {

        if (this.pendingPicks.hasOwnProperty(shipLineNbr))
            return this.pendingPicks[shipLineNbr];

        return 0;
    }

    getPendingAllocationQty(shipLineNbr, allocLineNbr) {

        var alloc = this.getPendingAllocation(shipLineNbr, allocLineNbr);

        if (alloc != null) {
            return alloc.PendingQty;
        }

        return 0;
    }

    getPendingAllocation(shipLineNbr, allocLineNbr) {

        if (this.pendingPicks.hasOwnProperty(shipLineNbr)) {

            for (let alloc of this.pendingPicks[shipLineNbr].Allocations) {

                if (alloc.hasOwnProperty('SplitLineNbr') && alloc.SplitLineNbr.value == allocLineNbr)
                    return alloc;
            }
        }

        return null;
    }

    getTotalPickedQty(item) {
        return item.TotalPickedQty.value + this.getPendingItemQty(item);
    }

    public addPick(data, curAlloc) {

        /*if (!this.remainingItems.hasOwnProperty(data.item)) {
            alert("The item " + data.item + " has no remaining quantity to pick.");
            return;
        }

        if (this.remainingItems[data.item] < data.qty) {
            alert("There is only " + this.remainingItems[data.item] + " units of this item left to pick, the entered qty is " + data.qty);
            return;
        }*/

        var sugAlloc = JSON.parse(JSON.stringify(curAlloc));

        var pendingAlloc = this.getPendingAllocation(sugAlloc.LineNbr.value, sugAlloc.SplitLineNbr.value);

        if (pendingAlloc != null && pendingAlloc.LocationID != data.location){

            delete sugAlloc.SplitLineNbr;
            sugAlloc.LocationID.value = data.location;
            sugAlloc.RemainingQty = data.qty;
            sugAlloc.PendingQty = data.qty;
            sugAlloc.Qty.value = data.qty;
            sugAlloc.id = PickProvider.getUniqueId();
            this.addPendingPick(sugAlloc);

        } else {

            sugAlloc.PendingQty = data.qty;
            sugAlloc.LocationID.value = data.location;
            sugAlloc.id = PickProvider.getUniqueId();
            this.addPendingPick(sugAlloc);
        }

        this.savePicks();
        this.generateSourceList();
    }

    private static getUniqueId() {
        return Math.random().toString(36).substr(2, 9);
    }

    public updatePick(shipLineNbr, id, qty) {

        if (!this.pendingPicks.hasOwnProperty(shipLineNbr))
            return; // TODO: Exception

        var index = 0;

        qty = parseFloat(qty);

        for (let alloc of this.pendingPicks[shipLineNbr].Allocations) {

            if (alloc.id == id) {

                if (qty <= 0){

                    this.pendingPicks[shipLineNbr].Allocations.splice(index, 1);

                    this.pendingPicks[shipLineNbr].PendingQty -= alloc.PendingQty;

                } else {

                    qty = Math.min(qty, this.pendingPicks[shipLineNbr].RemainingQty);

                    this.pendingPicks[shipLineNbr].PendingQty += qty - alloc.PendingQty;

                    this.pendingPicks[shipLineNbr].Allocations[index].PendingQty = qty;
                }

                break;
            }

            index++;
        }

        if (this.pendingPicks[shipLineNbr].Allocations.length == 0)
            delete this.pendingPicks[shipLineNbr];

        this.savePicks();
        this.generateSourceList();
    }

    private addPendingPick(pick) {

        pick.PendingQty = parseFloat(pick.PendingQty);

        var shipLineNum = pick.LineNbr.value;

        if (!this.pendingPicks.hasOwnProperty(shipLineNum)) {

            this.pendingPicks[shipLineNum] = {
                LineNbr: pick.LineNbr,
                InventoryID: pick.InventoryID,
                Allocations: []
            };

            this.pendingPicks[shipLineNum].PendingQty = pick.PendingQty;
            this.pendingPicks[shipLineNum].RemainingQty = pick.TotalRemainingQty;

            this.pendingPicks[shipLineNum].Allocations.push(pick);

        } else {

            // try to find current allocation and update quantity
            var index = 0;
            var locationMatchIdx = null;

            for (let alloc of this.pendingPicks[shipLineNum].Allocations) {

                if (pick.hasOwnProperty("SplitLineNbr") && alloc.hasOwnProperty("SplitLineNbr") && alloc.SplitLineNbr.value == pick.SplitLineNbr.value) {

                    this.pendingPicks[shipLineNum].Allocations[index].Qty = pick.Qty;
                    this.pendingPicks[shipLineNum].Allocations[index].RemainingQty = pick.RemainingQty;
                    this.pendingPicks[shipLineNum].Allocations[index].PendingQty += pick.PendingQty;
                    this.pendingPicks[shipLineNum].PendingQty += pick.PendingQty;
                    return;

                } else if (alloc.LocationID.value == pick.LocationID.value){

                    locationMatchIdx = index;
                    if (!pick.hasOwnProperty("SplitLineNbr"))
                        break;
                }

                index++;
            }

            if (locationMatchIdx != null){
                this.pendingPicks[shipLineNum].Allocations[locationMatchIdx].Qty = pick.Qty;
                this.pendingPicks[shipLineNum].Allocations[locationMatchIdx].RemainingQty = pick.RemainingQty;
                this.pendingPicks[shipLineNum].Allocations[locationMatchIdx].PendingQty += pick.PendingQty;
                this.pendingPicks[shipLineNum].PendingQty += pick.PendingQty;
                return;
            }

            this.pendingPicks[shipLineNum].PendingQty += pick.PendingQty;

            this.pendingPicks[shipLineNum].Allocations.push(pick);
        }

    }

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
        this.generateSourceList();
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

        return new Promise((resolve, reject) => {

            var data = {
                ShipmentNbr: this.currentShipment.ShipmentNbr,
                Details: []
            };

            for (var i in this.pendingPicks) {

                var item = {
                    LineNbr: {value: i},
                    Allocations: []
                };

                var alloc:any;

                var modified = this.modifiedAllocations.hasOwnProperty(i) ? this.modifiedAllocations[i] : {};

                console.log(JSON.stringify(modified));

                // Deleted allocations should be added first, otherwise API returns "shipped qty exceeds order qty" error
                // We will use this array to keep track of all unmodified or newly created allocations and add then to the array last
                var allocs = [];

                for (var x = 0; x < this.pendingPicks[i].Allocations.length; x++) {

                    var pendingAlloc = this.pendingPicks[i].Allocations[x];

                    alloc = {
                        LineNbr: {value: i},
                        Qty: pendingAlloc.Qty,
                        PickedQty: {value: pendingAlloc.PickedQty.value + pendingAlloc.PendingQty},
                        LocationID: pendingAlloc.LocationID
                    };

                    if (pendingAlloc.hasOwnProperty("SplitLineNbr")) {
                        alloc.SplitLineNbr = pendingAlloc.SplitLineNbr;

                        if (modified.Allocations.hasOwnProperty(pendingAlloc.SplitLineNbr.value)) {
                            alloc.Qty.value = modified.Allocations[pendingAlloc.SplitLineNbr.value].Qty.value;
                            delete modified.Allocations[pendingAlloc.SplitLineNbr.value];

                            item.Allocations.push(alloc);
                            continue;
                        }
                    }

                    if (alloc.Qty.value < alloc.PickedQty.value)
                        alloc.Qty.value = alloc.PickedQty.value;

                    allocs.push(alloc);
                }

                for (var y in modified.Allocations){

                    var modAlloc = modified.Allocations[y];

                    alloc = {
                        LineNbr: {value: i},
                        SplitLineNbr: modAlloc.SplitLineNbr,
                        Qty: modAlloc.Qty,
                    };

                    if (modAlloc.hasOwnProperty("delete"))
                        alloc["delete"] = true;

                    item.Allocations.push(alloc);
                }

                // Combine pending picks along with the modified/deleted ones they are replacing
                item.Allocations = item.Allocations.concat(allocs);

                data.Details.push(item);
            }

            console.log("Submitting Picks");
            console.log(JSON.stringify(data));

            this.api.putShipment(data).then((res:any)=> {

                this.currentShipment = res;

                this.pendingPicks = {};
                this.clearSavedPicks();

                this.generateSourceList();
                this.calculateQtys();

                resolve(res);

            }).catch((err)=> {
                err.message = "Failed to save picks. " + err.message;
                reject(err);
            });
        });

    }


}
