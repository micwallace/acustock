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
import { Api } from '../core/api'
import { CacheProvider } from '../core/cache'
import { PreferencesProvider } from "../core/preferences";

/*
 Generated class for the PickProvider provider.

 See https://angular.io/guide/dependency-injection for more info on providers
 and Angular DI.
 */
@Injectable()
export class PickProvider {

    public currentShipment = null;

    public sourceIndex = {};

    private modifiedAllocations = {};

    public pickList = [];

    public pendingPicks = {};

    public totalQty = 0;

    public unpickedQty = 0;

    public confirmedUnpickedQty = 0;

    public pendingQty = 0;

    private lastRequest:any = "";

    public shipmentList:any = [];

    public currentListIndex = 0;

    constructor(public api:Api, public cache:CacheProvider, public prefs:PreferencesProvider) {

    }

    public getShipmentList(refresh=false){

        return new Promise((resolve, reject)=> {

            if (this.shipmentList.length > 0 && !refresh){
                return resolve(this.shipmentList);
            }

            this.api.getShipmentList().then((res)=>{
                this.shipmentList = res;
                return resolve(this.shipmentList);
            }).catch((err) => {
                reject(err);
            });
        });
    }

    public loadNextShipment(){

        if (this.shipmentList.length > 0){
            this.currentListIndex++;

            if (this.currentListIndex < this.shipmentList.length){
                return this.loadShipment(this.shipmentList[this.currentListIndex].ShipmentNbr.value);
            }

            this.currentListIndex = 0;
        }

        return new Promise((resolve, reject)=> {

            this.getShipmentList(true).then((res:any)=>{

                if (res.length == 0){
                    return reject({message: "There are no shipments available to pick."});
                }

                this.loadShipment(this.shipmentList[this.currentListIndex].ShipmentNbr.value).then((res)=>{
                    resolve();
                }).catch((err) => {
                    reject(err);
                });

            }).catch((err) => {
                reject(err);
            });
        });
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

                // load saved picks
                var picks = JSON.parse(localStorage.getItem("unconfirmed_picks"));

                var id = this.currentShipment.ShipmentNbr.value;

                if (picks && picks.hasOwnProperty(id)) {
                    this.pendingPicks = picks[id];
                }

                this.generateSourceList();

                this.calculateQtys();

                resolve(true);

            }).catch((err) => {

                if (err.status == 404)
                    err.message = "Shipment #" + shipmentNbr + " was not found in the system.";

                console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));

                reject(err);
            });
        });

    }

    public precacheAvailability(){

        var inventoryIds = [];

        for (let location of this.pickList){
            for (let item of location.Items) {
                if (inventoryIds.indexOf(item.InventoryID.value) === -1)
                    inventoryIds.push(item.InventoryID.value);
            }
        }

        this.cache.preloadItemLocations(inventoryIds);
    }

    public getItemAvailabilty(itemId){

        return new Promise((resolve, reject)=> {

            this.cache.getItemLocations(itemId).then((res)=>{
                resolve(res);
            }).catch((err)=>{
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
                note: this.currentShipment.note, // stupid API deletes notes if they are not provided with PUT requests
                PickStatus: {value: "Assigned"},
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

    /**
     * Loop through the current shipment items and create a two level index of current allocations,
     * keyed by line number and split (allocation) line number. If the item contains an unallocated quantity,
     * an additional allocation keyed UNALLOCATED is created. This is because we want to display any unallocated
     * quantities on the picklist.
     */
    private generateSourceList(){

        this.sourceIndex = {};

        for (var i = 0; i < this.currentShipment.Details.length; i++) {

            var item = this.currentShipment.Details[i];

            if (this.isNonStock(item))
                continue;

            if (!item.PickedQty.value)
                item.PickedQty.value = 0;

            if (item.PickedQty.value >= item.ShippedQty.value)
                continue;

            /*var unpicked = Object.assign({}, item);
             unpicked.Allocations = [];
             unpicked.PickedQty = 0;*/

            var totalQty = item.ShippedQty.value;
            var allocatedQty = 0;

            var shipmentLine = item.LineNbr.value;

            for (var x = 0; x < item.Allocations.length; x++) {

                if (!item.Allocations[x].PickedQty.value)
                    item.Allocations[x].PickedQty.value = 0;

                var shipmentAlloc = JSON.parse(JSON.stringify(item.Allocations[x])); // copy object

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
                    SplitLineNbr: {value: "UNALLOCATED"},
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

    /**
     * Loops through currently pending picks (allocations) and strips or modifies the sourceIndex to remove
     * the pending quantities. The result is a source index that reflects what is remaining after taking into account
     * pending picks. It adds items to the modified index to keep track of existing allocations that have had their
     * quantity reduced or have been deleted. This data is used later when confirming picks.
     *
     * If the pick is an existing allocation, it's quantity is reduced or deleted first, then the remaining allocations
     * are reduced or deleted until the picks pending qty is exhausted.
     */
    private processPendingAllocations(){

        console.log("Triming source index for allocations");
        this.modifiedAllocations = {};

        var srcAlloc, diff, pendingQtyLeft, maxConsumedQty;

        for (var x in this.pendingPicks) {

            var pending = this.pendingPicks[x];

            console.log("Triming item: " + x);

            if (!this.sourceIndex.hasOwnProperty(x))
                continue;

            for (let alloc of pending.Allocations) {

                console.log("Triming allocation: ");
                console.log(JSON.stringify(alloc));

                // Consume the original allocation first if available, and then the rest until remaining pending qty is 0.
                pendingQtyLeft = alloc.PendingQty;

                if (alloc.hasOwnProperty("SplitLineNbr") && this.sourceIndex[x].Allocations.hasOwnProperty(alloc.SplitLineNbr.value)) {

                    srcAlloc = this.sourceIndex[x].Allocations[alloc.SplitLineNbr.value];

                    if (pendingQtyLeft < srcAlloc.RemainingQty) {

                        diff = srcAlloc.RemainingQty - pendingQtyLeft;

                        this.sourceIndex[x].Allocations[alloc.SplitLineNbr.value].RemainingQty = diff;

                        // This isn't needed at the moment
                        //this.sourceIndex[x].Allocations[alloc.SplitLineNbr.value].Qty.value = srcAlloc.Qty.value - pendingQty;

                        this.addModifiedAllocation(this.sourceIndex[x].Allocations[alloc.SplitLineNbr.value]);

                        console.log("Stage 1: Reduced remaining qty of current allocation " + pendingQtyLeft + " (remaining " + diff + ")");

                        pendingQtyLeft -= pendingQtyLeft;

                    } else {

                        maxConsumedQty = Math.min(srcAlloc.RemainingQty, pendingQtyLeft);

                        // If the allocation has already been partially picked, adjust it's quantity and add it to the modified allocations.
                        // Otherwise simply remove the remaining quantity from the source allocation index since the allocation has been fully picked
                        if (maxConsumedQty < srcAlloc.Qty.value){
                            this.sourceIndex[x].Allocations[alloc.SplitLineNbr.value].Qty.value = srcAlloc.Qty.value - maxConsumedQty;
                            this.addModifiedAllocation(this.sourceIndex[x].Allocations[alloc.SplitLineNbr.value]);
                        }

                        delete this.sourceIndex[x].Allocations[alloc.SplitLineNbr.value];

                        pendingQtyLeft -= maxConsumedQty;

                        console.log("Stage 1: Deleted current allocation " + maxConsumedQty + " (remaining " + pendingQtyLeft + ")");
                    }
                }

                if (pendingQtyLeft > 0) {
                    // TODO: Strip unallocated quantity first
                    for (var y in this.sourceIndex[x].Allocations) {

                        srcAlloc = this.sourceIndex[x].Allocations[y];

                        if (pendingQtyLeft < srcAlloc.RemainingQty){

                            diff = srcAlloc.RemainingQty - pendingQtyLeft;

                            this.sourceIndex[x].Allocations[y].RemainingQty = diff;
                            this.sourceIndex[x].Allocations[y].Qty.value = srcAlloc.Qty.value - pendingQtyLeft;

                            this.addModifiedAllocation(this.sourceIndex[x].Allocations[y]);

                            console.log("Stage 2: Reduced remaining qty of other allocations "+ pendingQtyLeft + " (remaining "+ diff +")");

                            pendingQtyLeft -= diff;

                        } else {

                            maxConsumedQty = Math.min(srcAlloc.RemainingQty, pendingQtyLeft);

                            // If the allocation has already been partially picked, adjust it's quantity, otherwise mark as deleted, then add it to the modified allocations.
                            if (maxConsumedQty < srcAlloc.Qty.value){
                                this.sourceIndex[x].Allocations[y].Qty.value = srcAlloc.Qty.value - maxConsumedQty;
                            } else {
                                this.sourceIndex[x].Allocations[y]["delete"] = true;
                            }

                            this.addModifiedAllocation(this.sourceIndex[x].Allocations[y]);

                            delete this.sourceIndex[x].Allocations[y];

                            pendingQtyLeft -= maxConsumedQty;

                            console.log("Stage 2: Deleted other allocation "+ maxConsumedQty + " (remaining "+pendingQtyLeft+")");
                        }

                        if (pendingQtyLeft <= 0)
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

        //console.log(alloc);

        this.modifiedAllocations[alloc.LineNbr.value].Allocations[alloc.SplitLineNbr.value] = alloc;
    }

    /**
     * Generates a pick list from the current sourceIndex. The pick list is grouped by location and then sorted based
     * on the pre-generated bin sequence.
     */
    private generatePickList() {

        var pickList = {};

        for (var i in this.sourceIndex) {

            var item = this.sourceIndex[i];


            for (var x in item.Allocations) {

                var pickItem = item.Allocations[x];

                var location = x == "UNALLOCATED" ? "(unassigned)" : pickItem.LocationID.value;

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

            pickList[y].Items.sort((a, b)=> {
                return a.InventoryID.value.localeCompare(b.InventoryID.value);
            });

            this.pickList.push(pickList[y]);
        }

        var binOrder = this.cache.binPickSequence;

        this.pickList.sort((a, b)=> {
            return (binOrder.indexOf(a.LocationID.value) < binOrder.indexOf(b.LocationID.value)) ? -1 : 1;
        });

    }

    calculateQtys() {

        this.totalQty = 0;
        this.pendingQty = 0;
        var pickedQty = 0;

        for (var i = 0; i < this.currentShipment.Details.length; i++) {

            var item = this.currentShipment.Details[i];

            if (this.isNonStock(item))
                continue;

            this.totalQty += item.ShippedQty.value;
            pickedQty += item.PickedQty.value;
        }

        this.confirmedUnpickedQty = this.totalQty - pickedQty;

        // add uncommitted picks
        for (var x in this.pendingPicks) {
            pickedQty += this.pendingPicks[x].PendingQty;
            this.pendingQty += this.pendingPicks[x].PendingQty;
        }

        this.unpickedQty = this.totalQty - pickedQty;
    }

    isNonStock(item){

        if (!item.hasOwnProperty("InventoryType"))
            return false;

        return ["Non-Stock Item", "Labor", "Service", "Charge", "Expense"].indexOf(item.InventoryType.value) > -1;
    }

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

        // TODO: Move quantity validation into this function

        data.qty = parseFloat(data.qty);

        var sugAlloc = JSON.parse(JSON.stringify(curAlloc));

        var pendingAlloc = this.getPendingAllocation(sugAlloc.LineNbr.value, sugAlloc.SplitLineNbr.value);

        // Add a new allocation if the suggested one has been partially picked or currently pending with a different location
        console.log("Current picked qty/location: "+sugAlloc.PickedQty.value+" / "+sugAlloc.LocationID.value);

        if ((sugAlloc.PickedQty.value > 0 && sugAlloc.LocationID.value != data.location) ||
            (pendingAlloc != null && pendingAlloc.LocationID != data.location)){

            delete sugAlloc.SplitLineNbr;
            sugAlloc.LocationID.value = data.location;
            sugAlloc.PickedQty.value = 0;
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
            return;

        var index = 0;

        qty = !qty ? 0 : parseFloat(qty);

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
                Allocations: [],
                ts: (new Date()).getTime()
            };

            this.pendingPicks[shipLineNum].PendingQty = pick.PendingQty;
            this.pendingPicks[shipLineNum].RemainingQty = pick.TotalRemainingQty;

            this.pendingPicks[shipLineNum].Allocations.push(pick);

        } else {

            this.pendingPicks[shipLineNum].ts = (new Date()).getTime();

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

    public clearSavedPicks() {

        this.pendingPicks = {};

        var picks = JSON.parse(localStorage.getItem("unconfirmed_picks"));

        if (!picks)
            return;

        delete picks[this.currentShipment.ShipmentNbr.value];

        localStorage.setItem("unconfirmed_picks", JSON.stringify(picks));

        this.generateSourceList();
        this.calculateQtys();
    }

    public confirmPicks() {

        return new Promise((resolve, reject) => {

            var data:any = {
                ShipmentNbr: this.currentShipment.ShipmentNbr,
                note: this.currentShipment.note, // stupid API deletes notes if they are not provided with PUT requests
                Details: []
            };

            if (["Open", "Assigned", "Partial", "Picked"].indexOf(this.currentShipment.PickStatus.value) > -1)
                data.PickStatus = {value: (this.unpickedQty > 0 ? "Partial" : "Picked")};

            for (var i in this.pendingPicks) {

                let lineNbr = parseInt(i);

                var item:any = {
                    LineNbr: {value: lineNbr},
                    InventoryID: this.pendingPicks[i].InventoryID, // InventoryID not needed but good for debugging data.
                    Allocations: []
                };

                var alloc:any;

                var modified = this.modifiedAllocations.hasOwnProperty(i) ? this.modifiedAllocations[i].Allocations : {};

                console.log(JSON.stringify(modified));

                // Deleted allocations should be added first, otherwise API returns "shipped qty exceeds order qty" error
                // We will use this array to keep track of all unmodified or newly created allocations and add then to the array last
                var allocs = [];

                for (var x = 0; x < this.pendingPicks[i].Allocations.length; x++) {

                    var pendingAlloc = this.pendingPicks[i].Allocations[x];

                    var pickedQty = pendingAlloc.PickedQty.value + pendingAlloc.PendingQty;

                    alloc = {
                        LineNbr: {value: lineNbr},
                        // If the allocation is over-picked or we are removing unpicked items, set the quantity to picked quantity.
                        Qty: {value: ((pendingAlloc.Qty.value < pickedQty) ? pickedQty : pendingAlloc.Qty.value)},
                        PickedQty: {value: pickedQty},
                        LocationID: pendingAlloc.LocationID
                    };

                    if (pendingAlloc.hasOwnProperty("SplitLineNbr") && pendingAlloc.SplitLineNbr.value != "UNALLOCATED") {

                        alloc.SplitLineNbr = pendingAlloc.SplitLineNbr;

                        if (modified.hasOwnProperty(pendingAlloc.SplitLineNbr.value)) {

                            // Skip modifying qty for allocations that are fully picked since it causes an error for
                            // allocations that are over-picked as it reverts the qty adjustment above, causing picked qty to exceed qty
                            // Eventually this could be fixed in the process pending allocations function but this is the easiest fix for now.
                            if (alloc.Qty.value > alloc.PickedQty.value) {
                                alloc.Qty.value = modified[pendingAlloc.SplitLineNbr.value].Qty.value;
                                item.Allocations.push(alloc);
                                delete modified[pendingAlloc.SplitLineNbr.value];
                                continue;
                            } else {
                                delete modified[pendingAlloc.SplitLineNbr.value];
                            }
                        }
                    }

                    allocs.push(alloc);
                }

                for (var y in modified){

                    var modAlloc = modified[y];

                    if (modAlloc.SplitLineNbr.value == "UNALLOCATED")
                        continue;

                    alloc = {
                        LineNbr: {value: lineNbr},
                        SplitLineNbr: modAlloc.SplitLineNbr,
                        Qty: modAlloc.Qty,
                        LocationID: modAlloc.LocationID,
                    };

                    if (alloc.Qty.value == 0 || modAlloc.hasOwnProperty("delete"))
                        alloc["delete"] = true;

                    item.Allocations.push(alloc);
                }

                // Combine pending picks along with the modified/deleted ones they are replacing
                item.Allocations = item.Allocations.concat(allocs);

                data.Details.push(item);
            }

            console.log("Submitting Picks");
            console.log(JSON.stringify(data));

            this.lastRequest = data;

            this.api.putShipment(data).then((res:any)=> {

                this.currentShipment = res;

                this.clearSavedPicks();

                this.shipmentList = []; // Force reload of shipment list

                resolve(res);

            }).catch((err)=> {
                err.message = "Failed to save picks. " + err.message;
                reject(err);
                console.log(JSON.stringify(err));
            });
        });

    }

    public removeUnpickedItems(){

        return new Promise((resolve, reject) => {

            var data:any = {
                ShipmentNbr: this.currentShipment.ShipmentNbr,
                note: this.currentShipment.note, // stupid API deletes notes if they are not provided with PUT requests
                PickStatus: {value: "Picked"},
                Details: []
            };

            let curItems = JSON.parse(JSON.stringify(this.currentShipment.Details));

            let remItems = {};

            let shipCompleteOrders = [];

            for (let order of this.currentShipment.Orders){

                if (order.ShippingRule && order.ShippingRule.value && order.ShippingRule.value == "Ship Complete")
                    shipCompleteOrders.push(order.OrderNbr.value);
            }

            for (let item of curItems){

                if (this.isNonStock(item))
                    continue;

                // Checking if shipped quantity > 0 will mean that items with no allocations are also removed.
                if (item.ShippedQty.value > 0 && item.PickedQty.value == item.ShippedQty.value)
                    continue;

                let itemUpdate:any = {
                    note: item.note,
                    LineNbr: item.LineNbr,
                    InventoryID: item.InventoryID, // InventoryID not needed but good for debugging data.
                    Allocations: []
                };

                // Keep track of items removed in order to send notification
                if (item.ShippedQty.value > 0 && shipCompleteOrders.indexOf(item.OrderNbr.value) > -1) {

                    let key = item.OrderNbr.value + "-" + item.InventoryID.value;

                    if (!remItems.hasOwnProperty(key))
                        remItems[key] = {
                            order: item.OrderNbr.value,
                            item: item.InventoryID.value,
                            description: item.Description.value,
                            qty: 0,
                            qty_left: 0,
                        };

                    remItems[key].qty += item.ShippedQty.value;
                    remItems[key].qty_left += (item.ShippedQty.value - item.PickedQty.value);
                }

                if (item.PickedQty.value == 0){

                    itemUpdate['delete'] = true;

                } else {

                    for (let alloc of item.Allocations){

                        /**
                         * For some reason explicitly deleting allocations isn't required when shipped qty is altered or deleted?
                         * Who fucking knows but it seems like allocations are all removed and replaced with the new ones.
                         * This is why SplitLineNbr isn't provided below.
                         * Maybe the same thing happens when committing picks but I haven't seem it cause any erroneous behaviour...yet.
                          */
                        if (alloc.PickedQty.value == 0)
                            continue;

                        let allocUpdate:any = {
                            LineNbr: item.LineNbr,
                            LocationID: alloc.LocationID,
                            Qty: alloc.PickedQty,
                            PickedQty: alloc.PickedQty
                        };

                        itemUpdate.Allocations.push(allocUpdate);
                    }

                    itemUpdate.ShippedQty = {value: 0}; // This makes it recalculate properly in that Acumatica
                }

                data.Details.push(itemUpdate);
            }

            //console.log("Removing unpicked items.");
            //console.log(JSON.stringify(data));

            this.lastRequest = data;

            this.api.putShipment(data).then((res:any)=> {

                this.currentShipment = res;

                this.generateSourceList();
                this.calculateQtys();

                resolve({
                    shipment: this.currentShipment.ShipmentNbr.value,
                    items: remItems
                });

            }).catch((err)=> {
                err.message = "Failed to remove unpicked items. " + err.message;
                reject(err);
                console.log(JSON.stringify(err));
            });

        });
    }

    public getErrorReportingData(){
        return {provider: "pick", pendingItems: this.pendingPicks, lastRequest: this.lastRequest};
    }
}
