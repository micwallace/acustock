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

    public pickList = [];

    public remainingItems = {};

    public pendingPicks = {};

    public savedPicks = null;

    public totalQty = 0;

    public unpickedQty = 0;

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

                //console.log(JSON.stringify(res));

                if (res.length == 0) {
                    reject({message:"Shipment #" + shipmentNbr + " was not found in the system."});
                    return;
                }

                let shipment = res[0];

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
                reject(err);
            });
        });

    }

    generatePickList() {

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

                var pickItem = item.Allocations[x];

                /*var pending = this.getPendingAllocation(pickItem.LineNbr.value, pickItem.SplitLineNbr.value);

                // Removed used allocations
                if (pending != null && (pending.deleted || pending.PendingQty >= pickItem.RemainingQty))
                    continue;*/

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
                pickItem.ShippedQty = item.ShippedQty.value;
                pickItem.TotalPickedQty = item.PickedQty.value;
                pickItem.TotalRemainingQty = item.ShippedQty.value - item.PickedQty.value;

                this.remainingItems[inventoryId] += remaining;

                pickList[location].Items.push(pickItem);
            }

            // add unallocated quantity to the picklist
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
                    LineNbr: item.LineNbr,
                    LocationID: {value: ""},
                    LotSerialNbr: {value: ""},
                    Qty: {value: unallocated},
                    PickedQty: {value: 0},
                    RemainingQty: unallocated,
                    ShippedQty: item.ShippedQty,
                    TotalPickedQty: item.PickedQty,
                    TotalRemainingQty: item.ShippedQty.value - item.PickedQty.value
                });
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

        //console.log(JSON.stringify(this.pickList));

    }

    private trimPicklist() {
        // loop through picklist and remove completed or replaced allocations
        var newPicklist = [];

        //console.log("Pending allocations: "+JSON.stringify(this.pendingPicks));

        for (var i = 0; i < this.pickList.length; i++) {

            var items = [];

            for (var x = 0; x < this.pickList[i].Items.length; x++) {

                var item = this.pickList[i].Items[x];

                var alloc = this.getPendingAllocation(item.LineNbr.value, item.SplitLineNbr.value);

                // Removed used allocations
                if (alloc == null || (!alloc.deleted && alloc.PendingQty < item.RemainingQty)) {
                    items.push(item);
                }
            }

            if (items.length > 0) {
                var copy = Object.assign({}, this.pickList[i]);
                copy.Items = items;
                newPicklist.push(copy);
            }
        }

        this.pickList = newPicklist;
    }

    calculateQtys() {

        this.totalQty = 0;
        var pickedQty = 0;

        for (var i = 0; i < this.currentShipment.Details.length; i++) {

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

    getPendingAllocationQty(shipLineNbr, allocLineNbr) {

        var alloc = this.getPendingAllocation(shipLineNbr, allocLineNbr);

        if (alloc != null) {
            return alloc.PendingQty;
        }

        return 0;
    }

    getPendingAllocation(shipLineNbr, allocLineNbr) {

        if (this.pendingPicks.hasOwnProperty(shipLineNbr)) {

            for (var i = 0; i < this.pendingPicks[shipLineNbr].Allocations.length; i++) {
                if (this.pendingPicks[shipLineNbr].Allocations[i].SplitLineNbr.value == allocLineNbr)
                    return this.pendingPicks[shipLineNbr].Allocations[i];
            }
        }

        return null;
    }

    getTotalPickedQty(item) {
        return item.TotalPickedQty.value + this.getPendingItemQty(item);
    }

    public addPick(data, curAlloc) {

        if (!this.remainingItems.hasOwnProperty(data.item)) {
            alert("The item " + data.item + " has no remaining quantity to pick.");
            return;
        }

        if (this.remainingItems[data.item] < data.qty) {
            alert("There is only " + this.remainingItems[data.item] + " units of this item left to pick, the entered qty is " + data.qty);
            return;
        }

        if (curAlloc) {

            var remainder, newAlloc;

            if (curAlloc && curAlloc.InventoryID.value == data.item) {

                var reqQty = data.qty;

                curAlloc = Object.assign({}, curAlloc);

                var pendingAlloc = this.getPendingAllocation(curAlloc.LineNbr.value, curAlloc.SplitLineNbr.value);
                var pendingQty = pendingAlloc != null ? pendingAlloc.PendingQty : 0;

                if (reqQty <= (curAlloc.RemainingQty - pendingQty)) {

                    if (pendingAlloc != null && pendingAlloc.LocationID.value != data.location) {

                        remainder = curAlloc.RemainingQty - reqQty;
                        curAlloc.PendingQty = 0;
                        curAlloc.RemainingQty = remainder;
                        curAlloc.Qty.value = remainder;
                        curAlloc.id = this.getUniqueId();
                        this.addPendingPick(curAlloc);

                        newAlloc = Object.assign({}, curAlloc);
                        delete newAlloc.SplitLineNbr;
                        newAlloc.LocationID.value = data.location;
                        newAlloc.RemainingQty = reqQty;
                        newAlloc.PendingQty = reqQty;
                        newAlloc.Qty.value = reqQty;
                        newAlloc.linkedIds = [curAlloc.id];
                        curAlloc.id = this.getUniqueId();
                        this.addPendingPick(newAlloc);

                    } else {
                        curAlloc.PendingQty = reqQty;
                        curAlloc.id = this.getUniqueId();
                        this.addPendingPick(curAlloc);
                    }

                } else {

                    reqQty -= curAlloc.RemainingQty;

                    var linkedIds = [];

                    // loop through available allocations and add either delete or adjust Qty until the requested qty has been exhausted.
                    for (let alloc of this.getSuggestedAllocations(data.item)) {

                        if (reqQty <= alloc.RemainingQty) {

                            if (reqQty < alloc.RemainingQty) {
                                // adjust allocation with remaining qty.
                                remainder = alloc.RemainingQty - reqQty;
                                alloc.RemainingQty = remainder;
                                alloc.PendingQty = 0;
                                alloc.Qty.value = remainder;
                                alloc.id = this.getUniqueId();
                                this.addPendingPick(alloc);
                                linkedIds.push(alloc.id);

                            } else {
                                alloc.deleted = true;
                                alloc.id = this.getUniqueId();
                                this.addPendingPick(alloc);
                                linkedIds.push(alloc.id);
                            }
                            return;
                        }

                        alloc.deleted = true;
                        alloc.id = this.getUniqueId();
                        this.addPendingPick(alloc);
                        linkedIds.push(alloc.id);

                        reqQty -= alloc.RemainingQty;
                    }

                    curAlloc.LocationID.value = data.location;
                    curAlloc.Qty.value = reqQty;
                    curAlloc.PendingQty = reqQty;
                    curAlloc.id = this.getUniqueId();
                    curAlloc.linkedIds = linkedIds;
                    this.addPendingPick(curAlloc);

                }
            }
        } else {
            alert("non suggested item entry not implemented");
        }

        this.savePicks();
        this.trimPicklist();
        //this.generatePickList();

    }

    private getUniqueId() {
        return Math.random().toString(36).substr(2, 9);
    }

    public removePick(shipLineNbr, id) {

        if (this.pendingPicks.hasOwnProperty(shipLineNbr)) {

            var linkedIds = [];
            var index = 0;

            for (let alloc of this.pendingPicks[shipLineNbr].Allocations) {

                if (alloc.id == id) {
                    linkedIds = this.pendingPicks[shipLineNbr].Allocations[index].linkedIds;
                    this.pendingPicks[shipLineNbr].Allocations.splice(index, 1);

                    break;
                }

                index++;
            }

            // Remove the allocations that were deleted/altered due to this allocation.
            if (linkedIds && linkedIds.length > 0) {

                index = 0;
                var newAllocs = [];
                for (let alloc of this.pendingPicks[shipLineNbr].Allocations) {

                    if (linkedIds.indexOf(alloc.id) === -1)
                        newAllocs.push(this.pendingPicks[shipLineNbr].Allocations[index]);

                    index++;
                }
                this.pendingPicks[shipLineNbr].Allocations = newAllocs;
            }

            if (this.pendingPicks[shipLineNbr].Allocations.length == 0) {
                delete this.pendingPicks[shipLineNbr];
            }

            this.savePicks();
            this.generatePickList();
            this.trimPicklist();
        }
    }

    public updatePick(item, qty) {
        var alloc = this.getPendingAllocation(item.LineNbr.value, item.SplitLineNbr.value);

        this.removePick(item.LineNbr.value, item.id);

        // remove and re-apply the pick to reallocate which current allocations it will replace
        this.addPick({
            location: item.LocationID.value,
            item: item.InventoryID.value,
            qty: qty
        }, alloc);
    }

    private getSuggestedAllocations(shipLineNbr) {

        if (this.pickList.hasOwnProperty(shipLineNbr))
            return this.pickList[shipLineNbr].Allocations;

        return [];
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

            this.pendingPicks[shipLineNum].Qty = pick.Qty;
            this.pendingPicks[shipLineNum].PendingQty = parseFloat(pick.PendingQty);
            this.pendingPicks[shipLineNum].RemainingQty = pick.TotalRemainingQty;

            this.pendingPicks[shipLineNum].Allocations.push(pick);

        } else {

            // try to find current allocation and update quantity
            var index = 0;
            if (pick.hasOwnProperty("SplitLineNbr"))
                for (let alloc of this.pendingPicks[shipLineNum].Allocations) {

                    if (alloc.SplitLineNbr.value == pick.SplitLineNbr.value) {
                        this.pendingPicks[shipLineNum].Allocations[index].Qty = pick.Qty;
                        this.pendingPicks[shipLineNum].Allocations[index].RemainingQty = pick.RemainingQty;
                        this.pendingPicks[shipLineNum].Allocations[index].PendingQty += parseFloat(pick.PendingQty);
                        this.pendingPicks[shipLineNum].PendingQty += parseFloat(pick.PendingQty);
                        return;
                    }

                    index++;
                }

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
        this.trimPicklist();
        //this.generatePickList();
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

                for (var x = 0; x < this.pendingPicks[i].Allocations.length; x++) {

                    var pendingAlloc = this.pendingPicks[i].Allocations[x];

                    var alloc:any = {
                        SplitLineNbr: {},
                        LineNbr: {value: i},
                        Qty: pendingAlloc.Qty,
                        PickedQty: {value: pendingAlloc.PickedQty.value + pendingAlloc.PendingQty}
                    };

                    if (pendingAlloc.SplitLineNbr.value) {
                        alloc.SplitLineNbr = pendingAlloc.SplitLineNbr;
                    }

                    item.Allocations.push(alloc);
                }

                data.Details.push(item);
            }

            console.log("Submitting Picks");
            console.log(JSON.stringify(data));

            this.api.putShipment(data).then((res:any)=> {

                this.currentShipment = res;

                this.pendingPicks = {};
                this.clearSavedPicks();

                this.generatePickList();
                this.trimPicklist();
                this.calculateQtys();

                resolve(res);

            }).catch((err)=> {
                err.message = "Failed to save picks. " + err.message;
                reject(err);
            });
        });

    }


}
