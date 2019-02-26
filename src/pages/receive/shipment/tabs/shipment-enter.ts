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

import { Component, ViewChild, NgZone, } from '@angular/core';
import { IonicPage, NavController, Events, AlertController, LoadingController, PopoverController, Tabs } from 'ionic-angular';
import { ReceiveProvider } from '../../../../providers/app/receive'
import { CacheProvider } from "../../../../providers/core/cache";
import { UtilsProvider } from "../../../../providers/core/utils";
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { ReceivePopover } from "../../receive-popover";
/**
 * Generated class for the PickShipmentsPickPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-receive',
    templateUrl: 'shipment-enter.html'
})
export class ReceiveShipmentEnterTab {

    @ViewChild('location') locationInput;
    @ViewChild('item') itemInput;
    @ViewChild('qty') qtyInput;

    enteredData = {
        location: "",
        item: "",
        qty: 0
    };

    currentSourceLine = null;

    showLocation = false;
    showQty = false;

    loader = null;
    loaderTimer = null;

    constructor(private zone:NgZone,
                public navCtrl:NavController,
                public receiveProvider:ReceiveProvider,
                public cache:CacheProvider,
                public events:Events,
                public alertCtrl:AlertController,
                public loadingCtrl:LoadingController,
                public popoverCtrl:PopoverController,
                public utils:UtilsProvider,
                public barcodeScanner:BarcodeScanner) {

    }

    barcodeScanHandler = (barcodeText)=>{
        var tabs: Tabs = this.navCtrl.parent;
        if (tabs.selectedIndex !== 0)
            tabs.select(0, {});

        this.onBarcodeScan(barcodeText)
    };

    ionViewDidLoad() {

        this.events.unsubscribe('barcode:scan');
        this.events.subscribe('barcode:scan', this.barcodeScanHandler);

        this.events.subscribe('receipts:confirm', ()=>{
            this.confirmReceipts();
        });

        this.events.subscribe('receipts:clear', ()=>{
            this.clearReceipts();
        });

        this.events.subscribe('receipts:open', (item)=>{
            this.setItem(item.InventoryID, false, null, item);
        });

        if (this.receiveProvider.hasSavedReceipts()) {

            this.utils.playPromptSound();

            let alert = this.alertCtrl.create({
                title: "Load saved receipts",
                message: "There are unconfirmed receipts available. Do you want to continue from where you left off?",
                buttons: [
                    {
                        text: "No",
                        role: "cancel",
                        handler: ()=> {
                            this.receiveProvider.clearSavedReceipts();
                        }
                    },
                    {
                        text: "Yes",
                        handler: ()=> {
                            this.receiveProvider.loadSavedReceipts();
                        }
                    }
                ]
            });

            alert.present();
        }
    }

    ionViewWillUnload(){
        this.events.unsubscribe('receipts:confirm');
        this.events.unsubscribe('receipts:clear');
        this.events.unsubscribe('receipts:open');
    }

    presentPopover(event) {
        let popover = this.popoverCtrl.create(ReceivePopover);
        popover.present({ev:event});
    }

    clearReceipts(){

        if (this.receiveProvider.pendingQty > 0) {

            let alert = this.alertCtrl.create({
                title: "Cancel Receipts",
                message: "Are you sure you want to clear all pending receipt items?",
                buttons: [
                    {
                        text: "Cancel",
                        role: "cancel"
                    },
                    {
                        text: "Yes",
                        handler: ()=> {
                            this.receiveProvider.clearSavedReceipts();
                        }
                    }
                ]
            });

            alert.present();
        }
    }

    resetForm(clearLocation=false) {

        this.enteredData.item = "";
        this.enteredData.qty = 0;

        this.currentSourceLine = null;

        this.showLocation = false;
        this.showQty = false;

    }

    public showLoaderDelayed(message){

        if (this.loader == null && this.loaderTimer == null){

            this.loaderTimer = setTimeout(()=>{
                this.loader = this.loadingCtrl.create({content: message});
                this.loader.present();
            }, 700);

        } else if (this.loader != null){
            this.loader.data.content = message;
        }
    }

    private dismissLoader() {

        if (this.loaderTimer != null){
            clearTimeout(this.loaderTimer);
            this.loaderTimer = null;
        }

        return new Promise((resolve, reject)=>{

            if (this.loader == null)
                return resolve();

            this.loader.dismiss().then(()=>{
                this.loader = null;
                resolve();
            }).catch((err)=>{
                resolve();
            });
        });
    }

    setItem(itemId, isScan=false, callback=null, receiptLine=null) {

        if (itemId) {
            this.enteredData.item = itemId;
        } else {
            itemId = this.enteredData.item;
        }

        if (itemId == "") {
            this.utils.showAlert("Error", "Please enter an item");
            return;
        }

        this.showLoaderDelayed("Loading...");

        this.currentSourceLine = null;

        this.cache.getItemById(itemId, true).then((item:any)=> {

            // validate item against source document
            if (receiptLine == null) {
                receiptLine = this.receiveProvider.getSourceLineByInventoryId(item.InventoryID.value);

                if (receiptLine == null) {
                    this.showQty = false;
                    this.enteredData.item = "";
                    this.enteredData.qty = 0;
                    this.utils.playFailedSound(isScan);
                    this.dismissLoader().then(()=> {
                        this.utils.showAlert("Error", "The item does not exist on this transfer/shipment or has already been received on another receipt.");
                    });
                    return;
                }
            }

            this.currentSourceLine = receiptLine;
            this.showLocation = true;

            if (this.enteredData.location != "") {
                this.showQty = true;
                this.enteredData.qty = 1;
            }

            if (isScan)
                this.utils.playScanSuccessSound();

            // Set default location
            if (receiptLine.hasOwnProperty("LocationID")){
                this.setLocation(receiptLine.LocationID);
                return;
            } else {
                var warehouseDetails = this.cache.getItemWarehouseDetails(item);
                if (warehouseDetails && warehouseDetails.hasOwnProperty("DefaultReceiptLocationID")){
                    this.setLocation(warehouseDetails.DefaultReceiptLocationID.value);
                    return;
                } else {
                    var warehouse = this.cache.getCurrentWarehouse();
                    if (warehouse && warehouse.hasOwnProperty("ReceivingLocationID")){
                        this.setLocation(warehouse.ReceivingLocationID.value);
                        return;
                    }
                }
            }

            this.dismissLoader();

            if (callback != null)
                callback();

        }).catch((err) => {
            this.showQty = false;
            this.enteredData.item = "";
            this.utils.playFailedSound(isScan);
            this.dismissLoader().then(()=> {
                this.utils.showAlert("Error", err.message, {exception: err});
            });
        });
    }

    setLocation(locId, isScan=false, callback=null) {

        if (locId) {
            this.enteredData.location = locId;
        } else {
            locId = this.enteredData.location;
        }

        if (locId == "") {
            this.utils.showAlert("Error", "Please enter a location");
            return;
        }

        this.showLoaderDelayed("Loading...");

        this.cache.getBinById(locId).then((bin:any)=> {

            // check if receipts are allowed for this location
            if (!bin.ReceiptsAllowed.value){
                this.showQty = false;
                this.enteredData.location = "";
                this.utils.playFailedSound(isScan);
                this.dismissLoader().then(()=>{
                    this.utils.showAlert("Error", "Receipts are not allowed for location "+bin.Description.value+" ("+bin.LocationID+")");
                });
                return;
            }

            if (this.enteredData.item != "") {
                this.showQty = true;
                this.enteredData.qty = 1;
            }

            if (isScan) this.utils.playScanSuccessSound();

            this.dismissLoader();

            if (callback != null)
                callback();

        }).catch((err) => {
            this.showQty = false;
            this.enteredData.location = "";
            this.utils.playFailedSound(isScan);
            this.dismissLoader().then(()=> {
                this.utils.showAlert("Error", err.message, {exception: err});
            });
        });

    }

    getRemainingQty(){
        if (this.currentSourceLine == null)
            return -1;

        return this.receiveProvider.getRemainingQty(this.currentSourceLine.LineNbr);
    }

    validateItemQty(qty:any) {

        if (!qty)
            qty = this.enteredData.qty;

        return (this.getRemainingQty() - qty) >= 0;
    }

    /*nextFromBin() {
        if (this.enteredData.item != "" && this.enteredData.qty > 0) {
            this.addReceiptItem();
        }
    }

    nextItem() {
        if (this.enteredData.item != "" && this.enteredData.qty > 0) {
            this.addReceiptItem();
        }
    }*/

    addReceiptItem(isScan=false) {
        // validate values
        if (!this.validateItemQty(null)) {
            this.utils.playFailedSound(isScan);
            this.utils.showAlert("Error", "You've entered a qty of "+this.enteredData.qty+" but there is only "+this.getRemainingQty()+" left to receive.");
            return false;
        }

        this.receiveProvider.addReceiptItem(this.enteredData, this.currentSourceLine);

        this.resetForm();

        if ((this.receiveProvider.unreceivedQty - this.receiveProvider.pendingQty) <= 0) {

            let alert = this.alertCtrl.create({
                title: "Receipt Complete",
                message: "All items for the current transfer or shipment have been received, would you like to confirm?",
                buttons: [
                    {
                        text: "Cancel",
                        role: "cancel"
                    },
                    {
                        text: "OK",
                        handler: ()=> {
                            alert.dismiss();
                            this.confirmReceipts();
                        }
                    }
                ]
            });

            alert.present();
        }

        return true;
    }

    confirmReceipts() {
        if (this.enteredData.item != "" &&  this.enteredData.location != "" && this.enteredData.qty > 0) {
            if (!this.addReceiptItem())
                return;
        }

        if (this.receiveProvider.pendingQty == 0)
            return this.utils.showAlert("Error", "Add some items to the receipt list first.");

        this.loader = this.loadingCtrl.create({content: "Submitting Receipts..."});
        this.loader.present();

        this.receiveProvider.confirmReceipts(this.loader).then((res:any)=>{
            this.dismissLoader();
            this.cache.flushItemLocationCache();
            this.events.publish("closeReceiveScreen");

            //console.log(res);

            //console.log(this.receiveProvider.transferShipment);

            var msg;
            if (this.receiveProvider.type == "shipment"){
                msg = "Shipment #"+res.ShipmentNbr.value+" was successfully updated";
            } else {
                msg = (this.receiveProvider.transferShipment == null ? "IN" : "PO") + " Receipt #" +
                    (this.receiveProvider.transferShipment == null ? res.ReferenceNbr.value : res.ReceiptNbr.value) +
                    " was successfully created" + (res.released ? " and released" : "");
            }

            this.utils.showAlert("Receipt Successful", msg);
        }).catch((err)=>{
            this.dismissLoader();
            this.utils.playFailedSound(false);
            this.utils.processApiError("Error", err.message, err, this.navCtrl, this.receiveProvider.getErrorReportingData());
        });
    }

    startCameraScanner(){

        var context = this;

        this.barcodeScanner.scan().then((barcodeData) => {
            if (barcodeData.cancelled)
                return;

            this.onBarcodeScan(barcodeData.text, function(){
                context.startCameraScanner();
            });

        }, (err) => {
            // An error occurred
            this.utils.showAlert("Error", "Error accessing barcode device: " + err, {exception: err});
        });
    }

    onBarcodeScan(barcodeText, callback=null) {
        console.log(barcodeText);

        this.showLoaderDelayed("Loading...");

        this.zone.run(()=> {

            // If the location and to-location is already set, scanning a bin barcode updates the to-location
            this.cache.getBinById(barcodeText).then((bin)=> {

                this.dismissLoader();

                this.setLocation(barcodeText, true, callback);

            }).catch((err) => {

                this.cache.getItemById(barcodeText).then((item:any)=> {

                    this.dismissLoader();

                    if (this.enteredData.item == "" || this.enteredData.qty == 0) {
                        this.setItem(item.InventoryID.value, true, callback);
                        return;
                    }

                    // If the item is the same as the last item, increment quantity.
                    if (item.InventoryID.value == this.enteredData.item) {

                        if (!this.validateItemQty(this.enteredData.qty + 1)) {
                            this.utils.playFailedSound(true);
                            this.utils.showAlert("Error", "You've already picked the quantity required for this item.");
                            return;
                        }

                        this.enteredData.qty++;

                        // If the completed quantity is reached let's automatically add the receipt item
                        if ((this.getRemainingQty() - this.enteredData.qty) <= 0) {
                            if (!this.addReceiptItem(true))
                                return;
                        }

                        this.utils.playScanSuccessSound();

                        if (callback != null)
                            callback();

                    } else {
                        if (this.addReceiptItem(true))
                            this.setItem(item.InventoryID.value, true, callback);

                    }
                }).catch((err) => {
                    this.dismissLoader();
                    this.utils.showAlert("Error", err.message);
                });
            });
        });
    }

}
