import { Injectable } from '@angular/core';
import { Api } from "../api/api";
import {PreferencesProvider} from "../preferences/preferences";

/*
 Generated class for the ReceiveProvider provider.

 See https://angular.io/guide/dependency-injection for more info on providers
 and Angular DI.
 */
@Injectable()
export class ReceiveProvider {

    public sourceDocument = null;

    public transferShipmentRef = null;

    public type = "";

    public sourceIndex = {};

    private savedReceipts = null;

    public pendingItems = {};

    public pendingQty = 0;

    public unreceivedQty = 0;

    public receivedQty = 0;

    public totalQty = 0;

    constructor(public api:Api, public prefs:PreferencesProvider) {
        console.log('Hello ReceiveProvider Provider');
    }

    public loadReceipt(referenceNbr, type) {

        return new Promise((resolve, reject)=> {

            this.transferShipmentRef = null;
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

                this.api.getShipment(referenceNbr, "Details,Details/Allocations,Orders").then((res:Array<any>)=> {

                    /*if (res.length == 0) {
                     reject({message:"Shipment #" + referenceNbr + " was not found in the system."});
                     return;
                     }*/
                    var curWarehouse = this.prefs.getPreference('warehouse');

                    let shipment = null;

                    if (res.length > 0) {

                        let shipment = res[0];

                        /*if (shipment.Operation.value != "Receipt" && shipment.Type.value != "Transfer") {
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
                            this.transferShipmentRef = transferRefs[0];

                            referenceNbr = transferRefs[0].InventoryRefNbr;

                        }
                    }

                    this.api.getTransfer(referenceNbr).then((res:Array<any>)=> {

                        if (res.length == 0) {
                            reject({message: "A transfer or receipt shipment document with #" + referenceNbr + " could not be found."});
                            return;
                        }

                        let transfer = res[0];

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
                        reject(err);
                    });

                }).catch((err)=> {
                    reject(err);
                });

            }

        });

    }

    private initialiseSource() {

        var receipts = JSON.parse(localStorage.getItem("unconfirmed_receipts"));

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
                    console.log(JSON.stringify(item.Allocations));
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

        console.log("Picks saved");
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
        var receipts = JSON.parse(localStorage.getItem("unconfirmed_receipts"));

        if (!receipts)
            return;

        delete receipts[this.sourceDocument.id];

        localStorage.setItem("unconfirmed_receipts", JSON.stringify(receipts));

        this.savedReceipts = null;
    }

    public confirmReceipts(loader) {

        return new Promise((resolve, reject)=> {

            var data;

            if (this.type == "shipment") {

                data = this.getShipmentUpdateObject();

                this.api.putShipment(data).then((res)=> {

                    loader.data.content = "Confirming Shipment...";

                    this.api.confirmShipment(data.ShipmentNbr.value).then((releaseRes)=> {

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

            if (this.type == "purchase" || this.transferShipmentRef != null){
                // Add purchase receipt document
                data = this.getPurchaseReceiptObject();

                this.api.putPurchaseReceipt(data).then((res)=>{

                    loader.data.content = "Releasing receipt...";

                    console.log("Purchase receipt #"+res.ReceiptNbr.value);

                    this.api.releasePurchaseReceipt(res.ReceiptNbr.value).then((releaseRes)=> {

                        this.postConfirmSuccess();

                        loader.data.content = "Reloading document...";

                        var sourceId = this.type == "purchase" ? this.sourceDocument.OrderNbr.value : this.transferShipmentRef.ShipmentNbr;

                        this.loadReceipt(sourceId, this.type).then((res)=>{
                            resolve(res);
                        }).catch((err)=> {
                            reject(err);
                        });

                    }).catch((err)=> {
                        reject(err);
                    });

                }).catch((err)=>{
                    reject(err);
                });

            } else {
                // Add receipt document which does not require a reference to a transfer order & shipment
                data = this.getReceiptObject();

                this.api.putReceipt(data).then((res)=>{

                    loader.data.content = "Releasing receipt...";

                    console.log("Receipt #"+res.ReferenceNbr.value);

                    this.api.releaseReceipt(res.ReferenceNbr.value).then((releaseRes)=> {

                        this.postConfirmSuccess();

                        loader.data.content = "Reloading document...";

                        this.loadReceipt(this.sourceDocument.ReferenceNbr.value, "transfer").then((res)=>{
                            resolve(res);
                        }).catch((err)=> {
                            reject(err);
                        });

                    }).catch((err)=> {
                        reject(err);
                    });

                }).catch((err)=>{
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

        for (var i in this.sourceDocument.Details) {

            var source = this.sourceDocument.Details[i];

            if (!this.pendingItems.hasOwnProperty(source.LineNbr.value)) {
                item = {
                    "delete": true,
                    LineNbr: source.LineNbr,
                    InventoryID: source.InventoryID,
                };

                data.Details.push(item);

                continue;
            }

            var pending = this.pendingItems[source.LineNbr.value];

            item = {
                LineNbr: source.LineNbr,
                InventoryID: source.InventoryID,
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

            // If there is only one allocation, update item level location ID
            /*if (Object.keys(pending.Allocations).length === 1) {
                item.LocationID = {value: pending.Allocations[Object.keys(pending.Allocations)].LocationID};
            }*/

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

        console.log(JSON.stringify(data));

        return data;
    }

    private getReceiptObject() {

        var data:any = {
            TransferNbr: this.sourceDocument.TransferNbr,
            Description: "AcuStock Transfer Receipt",
            Details: []
        };

        var warehouse = this.prefs.getPreference('warehouse');

        for (var i in this.pendingItems){

            var pending = this.pendingItems[i];

            var item:any = {
                LineNumber: {value: i},
                Warehouse: {value: warehouse},
                InventoryID: {value: pending.InventoryID},
                Quantity: {value: pending.Qty},
                Allocations: []
            };

            // If there is only one allocation, update item level location ID
            /*if (Object.keys(pending.Allocations).length === 1) {
                item.Location = {value: pending.Allocations[Object.keys(pending.Allocations)].LocationID};
            }*/

            // Add new allocations
            for (var y in pending.Allocations) {
                var newAlloc = pending.Allocations[y];

                item.Allocations.push({
                    LineNumber: {value: i},
                    InventoryID: {value: pending.InventoryID},
                    Location: {value: newAlloc.LocationID},
                    Quantity: {value: newAlloc.Qty},
                });
            }

            data.Details.push(item);

        }

        console.log("Receipt object");
        console.log(JSON.stringify(data));

        return data;

    }

    private getPurchaseReceiptObject(){

        var warehouse = this.prefs.getPreference('warehouse');

        var data:any = {
            Details: []
        };

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

        for (var i in this.pendingItems){

            var pending = this.pendingItems[i];

            var item:any = {
                Warehouse: {value: warehouse},
                InventoryID: {value: pending.InventoryID},
                ReceiptQty: {value: pending.Qty},
                Allocations: []
            };

            if (this.type == "purchase"){
                item.POLineNbr = {value: i};
                item.POOrderNbr = this.sourceDocument.OrderNbr;
                item.POOrderType = this.sourceDocument.Type;
            } else {
                item.TransferLineNbr = {value: i};
                item.TransferOrderNbr = {value: this.transferShipmentRef.OrderNbr};
                item.TransferOrderType = {value: this.transferShipmentRef.OrderType};
                item.TransferShipmentNbr = {value: this.transferShipmentRef.ShipmentNbr};
            }

            // If there is only one allocation, update item level location ID
            /*if (Object.keys(pending.Allocations).length === 1) {
                item.Location = {value: pending.Allocations[Object.keys(pending.Allocations)].LocationID};
            }*/

            // Add new allocations
            for (var y in pending.Allocations) {
                var newAlloc = pending.Allocations[y];

                item.Allocations.push({
                    InventoryID: {value: pending.InventoryID},
                    Location: {value: newAlloc.LocationID},
                    Quantity: {value: newAlloc.Qty},
                });
            }

            data.Details.push(item);

        }

        console.log(JSON.stringify(data));

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

}
