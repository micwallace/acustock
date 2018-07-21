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

    public type = "";

    public sourceIndex = {};

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

           if (type == "purchase"){

               this.api.getPurchaseOrder(referenceNbr).then((res:Array<any>)=>{

                   if (res.length == 0) {
                       reject({message:"Purchase #" + referenceNbr + " was not found in the system."});
                       return;
                   }

                   this.sourceDocument = res[0];
                   this.type = "purchase";
                   this.generateSourceData();
                   resolve(true);

               }).catch((err)=>{
                   reject(err);
               });

           } else {

               this.api.getShipment(referenceNbr, "Details,Details/Allocations,Orders").then((res:Array<any>)=>{

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
                           this.type = "shipment";
                           this.generateSourceData();
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
                               if (transferRefs.indexOf(order.InventoryRefNbr.value) === -1)
                                   transferRefs.push(order.InventoryRefNbr.value)
                           }

                           if (transferRefs.length == 0) {
                               reject({message: "Shipment #" + referenceNbr + " was found but does not have an associated transfer document. Use the 'Post to IN' action from the shipment page in Acumatica."});
                               return;
                           }

                           referenceNbr = transferRefs[0];

                       }
                   }

                   // TODO: allow selection of transfer? Can a transfer shipment even have more than one transfer document?
                   this.api.getTransfer(referenceNbr).then((res)=>{

                       if (res.length == 0) {
                           reject({message:"A transfer or receipt shipment document with #"+referenceNbr+" could not be found."});
                           return;
                       }

                       let transfer = res[0];

                       if (shipment != null){
                           if (transfer.ToWarehouseID.value !== curWarehouse) {
                               reject({message: "Transfer #" + referenceNbr + " was found but is in-transit to warehouse " + transfer.ToWarehouseID.value + ", not the currently selected warehouse which is " + curWarehouse});
                               return;
                           }
                       }

                       this.sourceDocument = transfer;
                       this.type = "transfer";
                       this.generateSourceData();
                       resolve(true);

                   }).catch((err)=>{
                       reject(err);
                   });

               }).catch((err)=>{
                   reject(err);
               });

           }

        });

    }

    private generateSourceData(){

        this.totalQty = 0;
        this.receivedQty = 0;
        this.sourceIndex = {};

        var curWarehouse = this.prefs.getPreference('warehouse');

        for (let item:any of this.sourceDocument.Details){

            if (this.type == "purchase" && item.WarehouseID.value != curWarehouse)
                continue;

            let itemInfo:any = {};

            itemInfo.InventoryID = item.InventoryID.value;
            itemInfo.Allocations = null;

            switch(this.type){

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

    public getSourceLineByInventoryId(inventoryId){

        for (var i in this.sourceIndex){

            if (this.sourceIndex[i].InventoryID == inventoryId){

                var remQty = this.getRemainingQty(i);

                if (remQty > 0)
                    return this.sourceIndex[i];
            }
        }

        return null;
    }

    private calculatePendingQty(){
        var pendingQty = 0;
        for (var i in this.pendingItems){
            pendingQty += this.pendingItems[i].Qty;
        }
        this.pendingQty = pendingQty;
    }

    public getPendingQty(lineNbr){

        if (!this.pendingItems.hasOwnProperty(lineNbr))
            return 0;

        return this.pendingItems[lineNbr].Qty;
    }

    public getRemainingQty(lineNbr){

        if (!this.sourceIndex.hasOwnProperty(lineNbr))
            return 0;

        return this.sourceIndex[lineNbr].QtyRemaining - this.getPendingQty(lineNbr);
    }

    public getTotalQty(lineNbr){
        if (!this.sourceIndex.hasOwnProperty(lineNbr))
            return 0;

        return this.sourceIndex[lineNbr].Qty;
    }

    public getReceivedAndPendingQty(lineNbr){
        return this.getTotalQty(lineNbr) - this.getRemainingQty(lineNbr);
    }

    public addReceiptItem(data, sourceLine){

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

        this.calculatePendingQty();

        console.log(JSON.stringify(this.pendingItems));
    }

    public updateReceiptItem(sourceLine, key, newQty){

        this.calculatePendingQty();
    }

    public removeReceiptItem(sourceLine, key){

        this.calculatePendingQty();
    }

    public confirmReceipts(){

    }

    public correctShipment(){

        return new Promise((resolve, reject)=>{

            if (this.type !== "shipment"){
                reject({message:"Current receipt document is not a shipment and cannot be corrected"});
                return;
            }

            this.api.correctShipment(this.sourceDocument.ShipmentNbr.value).then(()=>{
                resolve();
            }).catch((err)=>{
                reject(err);
            });
        });
    }

}
