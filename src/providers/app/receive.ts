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
import { Api } from "../core/api";
import { PreferencesProvider } from "../core/preferences";

/*
 Generated class for the ReceiveProvider provider.

 See https://angular.io/guide/dependency-injection for more info on providers
 and Angular DI.
 */
@Injectable()
export class ReceiveProvider {

    public sourceDocument = null;

    public transferShipment = null;

    public type = "";

    public sourceIndex = {};

    private savedReceipts = null;

    public pendingItems = {};

    public pendingQty = 0;

    public unreceivedQty = 0;

    public receivedQty = 0;

    public totalQty = 0;

    private lastRequest:any = "";

    constructor(public api:Api, public prefs:PreferencesProvider) {

    }

    public getReceiveList(type){

        switch(type){
            case "purchase":
                return this.api.getPurchaseOrderList();

            case "transfer":
                return this.api.getTransferList();

            case "shipment":
                return this.api.getReceiptShipmentsList();
        }
    }

    public loadReceipt(referenceNbr, type) {

        return new Promise((resolve, reject)=> {

            this.transferShipment = null;
            this.pendingItems = {};
            this.pendingQty = 0;

            if (type == "purchase") {

                this.api.getPurchaseOrder(referenceNbr).then((res:Array<any>)=> {

                    if (res.length == 0) {
                        reject({message: "Purchase #" + referenceNbr + " was not found in the system."});
                        return;
                    }

                    this.sourceDocument = res[0];
                    this.sourceDocument.id = referenceNbr;
                    this.type = "purchase";
                    this.initialiseSource();
                    resolve(true);

                }).catch((err)=> {
                    reject(err);
                });

            } else {

                this.api.getShipment(referenceNbr, "Details,Details/Allocations,Orders").then((res:any)=> {

                    /*if (res.length == 0) {
                     reject({message:"Shipment #" + referenceNbr + " was not found in the system."});
                     return;
                     }*/
                    var curWarehouse = this.prefs.getPreference('warehouse');

                    let shipment = res;

                    /*if (shipment.Operation.value != "Receipt" && shipment.Type.value != "Transfer"){
                        reject({message: "Shipment #" + referenceNbr + " was found but is not a transfer or receipt shipment."});
                        return;
                    }*/

                    if (shipment.Type.value == "Shipment" && shipment.Operation.value == "Receipt") {

                        if (shipment.WarehouseID.value !== curWarehouse) {
                            reject({message: "Shipment #" + referenceNbr + " was found but belongs to warehouse " + shipment.WarehouseID.value + ", not the currently selected warehouse which is " + curWarehouse});
                            return;
                        }

                        this.sourceDocument = shipment;
                        this.sourceDocument.id = referenceNbr;
                        this.type = "shipment";
                        this.initialiseSource();
                        resolve(true);
                        return;
                    }

                    if (shipment.Type.value == "Transfer") {

                        if (shipment.ToWarehouseID.value !== curWarehouse) {
                            reject({message: "Transfer shipment #" + referenceNbr + " was found but is in-transit to warehouse " + shipment.ToWarehouseID.value + ", not the currently selected warehouse which is " + curWarehouse});
                            return;
                        }

                        // Get transfer reference numbers from the order list
                        var transferRefs = [];
                        for (let order of shipment.Orders) {
                            transferRefs.push({
                                InventoryRefNbr: order.InventoryRefNbr.value,
                                OrderType: order.OrderType.value,
                                OrderNbr: order.OrderNbr.value,
                                ShipmentNbr: shipment.ShipmentNbr.value
                            })
                        }

                        if (transferRefs.length == 0) {
                            reject({message: "Shipment #" + referenceNbr + " was found but does not have an associated transfer document. Use the 'Post to IN' action from the shipment page in Acumatica."});
                            return;
                        }

                        // TODO: allow selection of transfer? Can a transfer shipment even have more than one transfer document?
                        this.transferShipment = transferRefs[0];

                        referenceNbr = transferRefs[0].InventoryRefNbr;

                    }

                    this.api.getTransfer(referenceNbr).then((transfer:any)=> {

                        if (shipment != null) {
                            if (transfer.ToWarehouseID.value !== curWarehouse) {
                                reject({message: "Transfer #" + referenceNbr + " was found but is in-transit to warehouse " + transfer.ToWarehouseID.value + ", not the currently selected warehouse which is " + curWarehouse});
                                return;
                            }
                        }

                        this.sourceDocument = transfer;
                        this.sourceDocument.id = referenceNbr;
                        this.type = "transfer";
                        this.initialiseSource();
                        resolve(true);

                    }).catch((err)=> {

                        if (err.status == 404)
                            err.message =  "A transfer or receipt shipment document with #" + referenceNbr + " could not be found.";

                        reject(err);
                    });

                }).catch((err)=> {

                    if (err.status == 404){

                        this.api.getTransfer(referenceNbr).then((transfer:any)=> {

                            this.sourceDocument = transfer;
                            this.sourceDocument.id = referenceNbr;
                            this.type = "transfer";
                            this.initialiseSource();
                            resolve(true);

                        }).catch((err)=> {

                            if (err.status == 404)
                                err.message =  "A transfer or receipt shipment document with #" + referenceNbr + " could not be found.";

                            reject(err);
                        });

                    }

                    reject(err);
                });

            }

        });

    }

    // TODO: Use separate function for loading transfers.
    /*private loadTransfer(referenceNbr){

    }*/

    private initialiseSource() {

        var receipts = JSON.parse(localStorage.getItem("unconfirmed_receipts"));

        console.log("Saved receipts: "+localStorage.getItem("unconfirmed_receipts"));

        var id = this.sourceDocument.id;

        if (receipts && receipts.hasOwnProperty(id)) {
            this.savedReceipts = receipts[id];
        } else {
            this.savedReceipts = null;
        }

        this.generateSourceData();
    }

    private generateSourceData() {

        this.totalQty = 0;
        this.receivedQty = 0;
        this.sourceIndex = {};

        var curWarehouse = this.prefs.getPreference('warehouse');

        for (let item of this.sourceDocument.Details) {

            if (this.type == "purchase" && item.WarehouseID.value != curWarehouse)
                continue;

            let itemInfo:any = {};

            itemInfo.InventoryID = item.InventoryID.value;
            itemInfo.Allocations = null;

            switch (this.type) {

                case "shipment":
                    itemInfo.LineNbr = item.LineNbr.value;
                    itemInfo.Qty = item.ShippedQty.value;
                    itemInfo.QtyReceived = 0;
                    itemInfo.QtyRemaining = item.ShippedQty.value;
                    itemInfo.Allocations = item.Allocations;
                    itemInfo.LocationID = item.LocationID.value;
                    break;

                case "transfer":
                    itemInfo.LineNbr = item.LineNumber.value;
                    itemInfo.Qty = item.Quantity.value;
                    itemInfo.QtyReceived = item.ReceivedQty.value;
                    itemInfo.QtyRemaining = itemInfo.Qty - itemInfo.QtyReceived;
                    break;

                case "purchase":
                    itemInfo.LineNbr = item.LineNbr.value;
                    itemInfo.Qty = item.OrderQty.value;
                    itemInfo.QtyReceived = item.QtyOnReceipts.value;
                    itemInfo.QtyRemaining = itemInfo.Qty - itemInfo.QtyReceived;
                    break;
            }

            this.sourceIndex[itemInfo.LineNbr] = itemInfo;
            this.totalQty += itemInfo.Qty;
            this.receivedQty += itemInfo.QtyReceived;
        }

        this.unreceivedQty = this.totalQty - this.receivedQty;
    }

    public getSourceLineByInventoryId(inventoryId) {

        for (var i in this.sourceIndex) {

            if (this.sourceIndex[i].InventoryID == inventoryId) {

                var remQty = this.getRemainingQty(i);

                if (remQty > 0)
                    return this.sourceIndex[i];
            }
        }

        return null;
    }

    private calculatePendingQty() {
        var pendingQty = 0;
        for (var i in this.pendingItems) {
            pendingQty += this.pendingItems[i].Qty;
        }
        this.pendingQty = pendingQty;
    }

    public getPendingQty(lineNbr) {

        if (!this.pendingItems.hasOwnProperty(lineNbr))
            return 0;

        return this.pendingItems[lineNbr].Qty;
    }

    public getCommittedRemainingQty(lineNbr) {

        if (!this.sourceIndex.hasOwnProperty(lineNbr))
            return 0;

        return this.sourceIndex[lineNbr].QtyRemaining;
    }

    public getTotalQty(lineNbr) {

        if (!this.sourceIndex.hasOwnProperty(lineNbr))
            return 0;

        return this.sourceIndex[lineNbr].Qty;
    }

    public getRemainingQty(lineNbr) {
        return this.getCommittedRemainingQty(lineNbr) - this.getPendingQty(lineNbr);
    }

    public getReceivedAndPendingQty(lineNbr) {
        return this.getTotalQty(lineNbr) - this.getRemainingQty(lineNbr);
    }

    public addReceiptItem(data, sourceLine) {

        //var sourceLine:any = this.getSourceLineByInventoryId(data.item);

        if (!sourceLine)
            return;

        data.qty = parseFloat(data.qty);

        if (!this.pendingItems.hasOwnProperty(sourceLine.LineNbr))
            this.pendingItems[sourceLine.LineNbr] = {
                InventoryID: sourceLine.InventoryID,
                Qty: 0,
                Allocations: {}
            };

        // key is only locationid now but serial/lot can be added in the future
        var key = data.location;

        if (!this.pendingItems[sourceLine.LineNbr].Allocations.hasOwnProperty(key))
            this.pendingItems[sourceLine.LineNbr].Allocations[key] = {
                LocationID: data.location,
                Qty: 0
            };

        this.pendingItems[sourceLine.LineNbr].Qty += data.qty;

        this.pendingItems[sourceLine.LineNbr].Allocations[key].Qty += data.qty;

        this.saveReceipts();

        console.log(JSON.stringify(this.pendingItems));
    }

    public updateReceiptItem(line, key, newQty) {

        if (this.pendingItems.hasOwnProperty(line) && this.pendingItems[line].Allocations.hasOwnProperty(key)) {

            var diff = newQty - this.pendingItems[line].Allocations[key].Qty;

            this.pendingItems[line].Allocations[key].Qty += diff;
            this.pendingItems[line].Qty += diff;

            this.saveReceipts();
        }
    }

    public removeReceiptItem(line, key) {

        if (this.pendingItems.hasOwnProperty(line) && this.pendingItems[line].Allocations.hasOwnProperty(key)) {

            this.pendingItems[line].Qty -= this.pendingItems[line].Allocations[key].Qty;
            delete this.pendingItems[line].Allocations[key];

            if (Object.keys(this.pendingItems[line].Allocations).length == 0)
                delete this.pendingItems[line];

            this.saveReceipts();
        }
    }

    public saveReceipts() {
        var receipts = JSON.parse(localStorage.getItem("unconfirmed_receipts"));

        if (!receipts)
            receipts = {};

        receipts[this.sourceDocument.id] = this.pendingItems;

        localStorage.setItem("unconfirmed_receipts", JSON.stringify(receipts));

        this.calculatePendingQty();
    }

    public hasSavedReceipts() {
        return this.savedReceipts != null;
    }

    public loadSavedReceipts() {
        this.pendingItems = this.savedReceipts;
        this.calculatePendingQty();
    }

    public clearSavedReceipts() {

        this.savedReceipts = null;
        this.pendingItems = {};
        this.calculatePendingQty();

        var receipts = JSON.parse(localStorage.getItem("unconfirmed_receipts"));

        if (!receipts)
            return;

        delete receipts[this.sourceDocument.id];

        localStorage.setItem("unconfirmed_receipts", JSON.stringify(receipts));
    }

    public confirmReceipts(loader) {

        return new Promise((resolve, reject)=> {

            var data:any;

            if (this.type == "shipment") {

                data = this.getShipmentUpdateObject();

                this.lastRequest = data;

                this.api.putShipment(data).then((res:any)=> {

                    loader.data.content = "Confirming Shipment...";

                    this.api.confirmShipment(data.ShipmentNbr.value).then((res)=> {

                        this.postConfirmSuccess();

                        this.sourceDocument = res;
                        this.sourceDocument.Status.value = "Confirmed";
                        this.sourceDocument.id = data.ShipmentNbr.value;

                        this.generateSourceData();

                        resolve(res);
                    }).catch((err)=> {
                        reject(err);
                    });

                }).catch((err)=> {
                    reject(err);
                });

                return;
            }

            if (this.type == "purchase" || this.transferShipment != null){
                // Add purchase receipt document
                data = this.getPurchaseReceiptObject();

                this.lastRequest = data;

                this.api.putPurchaseReceipt(data).then((res:any)=>{

                    if (!this.prefs.getPreference("release_receipts"))
                        return resolve(res);

                    loader.data.content = "Releasing receipt...";

                    //console.log("Purchase receipt #"+res.ReceiptNbr.value);

                    this.api.releasePurchaseReceipt(res.ReceiptNbr.value).then((releaseRes)=> {

                        this.postConfirmSuccess();

                        loader.data.content = "Reloading document...";

                        var sourceId = this.type == "purchase" ? this.sourceDocument.OrderNbr.value : this.transferShipment.ShipmentNbr;

                        res.released = true;

                        this.loadReceipt(sourceId, this.type).then((reloadRes)=>{
                            resolve(res);
                        }).catch((err)=> {
                            reject(err);
                        });

                    }).catch((err)=> {

                        loader.data.content = "Failed to release, reverting changes...";

                        this.api.deletePurchaseReceipt(res.id).then((deleteRes:any)=> {
                            err.message = "Failed to release purchase receipt. " + err.message;
                            reject(err);
                        }).catch((derror)=> {
                            err.message = "Failed to release purchase receipt and revert changes. Please delete purchase receipt #" + res.ReceiptNbr.value + " manually." + err.message + " " + derror.message;
                            reject(err);
                        });
                    });

                }).catch((err)=>{
                    reject(err);
                });

            } else {
                // Add IN receipt document, which does not require a reference to a transfer order & shipment

                data = this.getReceiptObject();

                this.lastRequest = data;

                this.api.putReceipt(data).then((res:any)=> {

                    if (!this.prefs.getPreference("release_receipts"))
                        return resolve(res);

                    loader.data.content = "Releasing receipt...";

                    console.log("Receipt #" + res.ReferenceNbr.value);

                    this.api.releaseReceipt(res.ReferenceNbr.value).then((releaseRes)=> {

                        this.postConfirmSuccess();

                        loader.data.content = "Reloading document...";

                        res.released = true;

                        this.loadReceipt(this.sourceDocument.ReferenceNbr.value, "transfer").then((reloadRes)=> {
                            resolve(res);
                        }).catch((err)=> {
                            reject(err);
                        });

                    }).catch((err)=> {

                        loader.data.content = "Failed to release, reverting changes...";

                        this.api.deleteReceipt(res.ReferenceNbr.value).then((deleteRes:any)=> {
                            err.message = "Failed to release receipt. " + err.message;
                            reject(err);
                        }).catch((derror)=> {
                            err.message = "Failed to release receipt and revert changes. Please delete receipt #" + res.ReferenceNbr.value + " manually." + err.message + " " + derror.message;
                            reject(err);
                        });
                    });

                }).catch((err)=> {
                    reject(err);
                });
            }

        });
    }

    private postConfirmSuccess(){
        this.clearSavedReceipts();
        this.pendingItems = {};
        this.calculatePendingQty();
    }

    private getShipmentUpdateObject() {

        var data:any = {
            ShipmentNbr: this.sourceDocument.ShipmentNbr,
            Details: []
        };

        var item:any;

        for (var i in this.sourceIndex) {

            var source = this.sourceIndex[i];

            if (!this.pendingItems.hasOwnProperty(source.LineNbr)) {
                item = {
                    "delete": true,
                    LineNbr: {value: source.LineNbr},
                    InventoryID: {value: source.InventoryID},
                };

                data.Details.push(item);

                continue;
            }

            var pending = this.pendingItems[source.LineNbr];

            item = {
                LineNbr: {value: source.LineNbr},
                InventoryID: {value: source.InventoryID},
                ShippedQty: {value: pending.Qty},
                Allocations: []
            };

            // Remove existing allocations
            for (var x = 0; x < source.Allocations.length; x++) {
                var oldAlloc = source.Allocations[x];
                item.Allocations.push({
                    "delete": true,
                    LineNbr: oldAlloc.LineNbr,
                    SplitLineNbr: oldAlloc.SplitLineNbr,
                });
            }

            // Add new allocations
            for (var y in pending.Allocations) {
                var newAlloc = pending.Allocations[y];

                item.Allocations.push({
                    LineNbr: {value: pending.LineNbr},
                    LocationID: {value: newAlloc.LocationID},
                    Qty: {value: newAlloc.Qty},
                });
            }

            data.Details.push(item);
        }

        //console.log(JSON.stringify(data));

        return data;
    }

    private getReceiptObject() {

        var data:any = {
            TransferNbr: this.sourceDocument.ReferenceNbr,
            Description: {value: "AcuStock Transfer Receipt"},
            Hold: {value: false},
            Details: []
        };

        var warehouse = this.prefs.getPreference('warehouse');


        for (var i in this.pendingItems){

            var pending = this.pendingItems[i];

            var item:any = {
                OrigRefNbr: this.sourceDocument.ReferenceNbr,
                OrigLineNbr: {value: i},
                InventoryID: {value: pending.InventoryID},
                Warehouse: {value: warehouse},
                //Location: {value: newAlloc.LocationID},
                Quantity: {value: pending.Qty},
                Allocations: []
            };

            // Add new allocations
            for (var y in pending.Allocations) {

                 var newAlloc = pending.Allocations[y];

                 item.Allocations.push({
                     Location: {value: newAlloc.LocationID},
                     Quantity: {value: newAlloc.Qty},
                 });
            }

            data.Details.push(item);

        }

        //console.log("Receipt object");
        //console.log(JSON.stringify(data));

        return data;

    }

    private getPurchaseReceiptObject(){

        var warehouse = this.prefs.getPreference('warehouse');

        var data:any = {};

        if (this.type == "purchase"){
            data.Type = {value: "Receipt"};
            data.CreateBill = {value: false};
            data.Vendor = this.sourceDocument.Vendor;
            data.VendorRef = {value: "AcuStock Receipt"};
            console.log("Purchase receipt object");
        } else {
            data.Type = {value: "Transfer Receipt"};
            data.Warehouse = {value: warehouse};
            console.log("Transfer purchase receipt object");
        }

        data.Details = [];

        for (var i in this.pendingItems){

            var pending = this.pendingItems[i];

            var item:any = {
                InventoryID: {value: pending.InventoryID},
                Warehouse: {value: warehouse},
                //Location: {value: newAlloc.LocationID},
                ReceiptQty: {value: pending.Qty},
                Allocations: []
            };

            if (this.type == "purchase"){
                item.POLineNbr = {value: i};
                item.POOrderNbr = this.sourceDocument.OrderNbr;
                item.POOrderType = this.sourceDocument.Type;
            } else {
                item.OrigRefNbr = this.sourceDocument.ReferenceNbr;
                item.OrigLineNbr = {value: i};
                item.TransferOrderNbr = {value: this.transferShipment.OrderNbr};
                item.TransferOrderType = {value: this.transferShipment.OrderType};
                item.TransferShipmentNbr = {value: this.transferShipment.ShipmentNbr};
            }

            for (var y in pending.Allocations) {

                var newAlloc = pending.Allocations[y];

                item.Allocations.push({
                    Location: {value: newAlloc.LocationID},
                    Quantity: {value: newAlloc.Qty},
                });
            }

            data.Details.push(item);
        }

        //console.log(JSON.stringify(data));

        return data;
    }

    public correctShipment() {

        return new Promise((resolve, reject)=> {

            if (this.type !== "shipment") {
                reject({message: "Current receipt document is not a shipment and cannot be corrected"});
                return;
            }

            this.api.correctShipment(this.sourceDocument.ShipmentNbr.value).then(()=> {
                resolve();
            }).catch((err)=> {
                reject(err);
            });
        });
    }

    public getErrorReportingData(){
        return {provider: "receive", pendingItems: this.pendingItems, lastRequest: this.lastRequest};
    }

}
