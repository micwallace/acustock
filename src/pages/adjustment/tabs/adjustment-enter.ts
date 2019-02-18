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

import { Component, ViewChild, NgZone } from '@angular/core';
import { IonicPage, NavController, Events, AlertController, PopoverController, Tabs } from 'ionic-angular';
import { AdjustmentProvider } from '../../../providers/app/adjustment'
import { CacheProvider } from "../../../providers/core/cache";
import { LoadingController } from "ionic-angular/index";
import { UtilsProvider } from "../../../providers/core/utils";
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import {AdjustmentPopover} from "../adjustment-popover";

@IonicPage()
@Component({
    selector: 'page-adjustment',
    templateUrl: 'adjustment-enter.html'
})
export class AdjustmentEnterTab {

    @ViewChild('location') locationInput;
    @ViewChild('item') itemInput;
    @ViewChild('qty') qtyInput;

    enteredData:any = {
        location: "",
        item: "",
        qty: 0,
        shelfQty: 0,
        shippedQty: 0
    };

    currentLocationItems = {};

    showQty = false;

    loader = null;
    loaderTimer = null;

    barcodeScanHandler = (barcodeText)=>{
        var tabs: Tabs = this.navCtrl.parent;
        if (tabs.selectedIndex !== 0)
            tabs.select(0, {});

        this.onBarcodeScan(barcodeText);
    };

    constructor(private zone:NgZone,
                public navCtrl:NavController,
                public adjustmentProvider:AdjustmentProvider,
                public cache:CacheProvider,
                public popoverCtrl:PopoverController,
                public events:Events,
                public alertCtrl:AlertController,
                public loadingCtrl:LoadingController,
                public utils:UtilsProvider,
                public barcodeScanner:BarcodeScanner) {

    }

    ionViewDidLoad() {
        this.events.subscribe('barcode:scan', this.barcodeScanHandler);

        this.events.subscribe('adjustments:commit', ()=>{
            this.commitAdjustments();
        });

        this.events.subscribe('adjustments:clear', ()=>{
            this.clearAdjustments();
        });

        if (this.adjustmentProvider.pendingNumItems > 0){

            this.showLoaderDelayed("Checking book quantities..");

            this.adjustmentProvider.validateBookQtys().then((res:any)=>{

                this.dismissLoader().then(()=>{
                    if (res.length > 0){
                        this.utils.showAlert("Error", "Some pending items were removed from the adjustment because their book quantity had changed.");
                    }
                });

            }).catch((err) => {
                this.dismissLoader().then(()=> {
                    this.utils.showAlert("Error", err.message, {exception: err});
                });
            });
        }
    }

    ionViewWillUnload(){
        this.events.unsubscribe('barcode:scan', this.barcodeScanHandler);
        this.events.unsubscribe('adjustments:commit');
        this.events.unsubscribe('adjustments:clear');
    }

    presentPopover(event) {
        let popover = this.popoverCtrl.create(AdjustmentPopover);
        popover.present({ev:event});
    }

    resetForm() {

        this.enteredData = {
            location: "",
            item: "",
            qty: 0,
            shelfQty: 0,
            shippedQty: 0
        };

        this.currentLocationItems = {};

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

        // Validate bin and load current bin contents
        this.cache.getBinById(locId).then((bin:any)=> {

            this.cache.getLocationItems(locId).then((itemIndex:any)=> {

                this.dismissLoader();

                this.currentLocationItems = itemIndex;

                if (this.enteredData.item != "")
                    this.loadItem();

                if (callback != null)
                    callback();

                if (isScan) {
                    this.utils.playScanSuccessSound();
                    return;
                }

                this.itemInput.setFocus();

            }).catch((err) => {
                this.showQty = false;
                this.enteredData.location = "";
                this.utils.playFailedSound(isScan);
                this.dismissLoader().then(()=> {
                    this.utils.showAlert("Error", err.message, {exception: err});
                });
            });

        }).catch((err) => {
            this.showQty = false;
            this.enteredData.location = "";
            this.utils.playFailedSound(isScan);
            this.dismissLoader().then(()=> {
                this.utils.showAlert("Error", err.message, {exception: err});
            });
        });

    }

    setItem(itemId, isScan=false, callback = null) {

        if (itemId) {
            this.enteredData.item = itemId;
        } else {
            itemId = this.enteredData.item;
        }

        if (this.enteredData.item == "") {
            this.utils.showAlert("Error", "Please enter an item");
            return;
        }

        this.showLoaderDelayed("Loading...");

        this.cache.getItemById(itemId).then((item:any)=> {

            this.dismissLoader();

            this.enteredData.item = item.InventoryID.value; // change alternate IDs like barcodes to primary ID

            this.loadItem();

            if (callback != null)
                callback();

            if (isScan) {
                this.utils.playScanSuccessSound();
                return;
            }

            setTimeout(()=> {
                this.qtyInput.setFocus();
            });

        }).catch((err) => {
            this.showQty = false;
            this.enteredData.item = "";
            this.utils.playFailedSound(isScan);
            this.dismissLoader().then(()=> {
                this.utils.showAlert("Error", err.message, {exception: err});
            });
        });
    }

    loadItem(){
        // get current item quantity
        if (this.currentLocationItems.hasOwnProperty(this.enteredData.item)) {
            this.enteredData.shelfQty = this.currentLocationItems[this.enteredData.item].QtyOnHand.value;
            this.enteredData.shippedQty = this.currentLocationItems[this.enteredData.item].QtySOShipped ? this.currentLocationItems[this.enteredData.item].QtySOShipped.value : 0;
            this.enteredData.shelfQty -= this.enteredData.shippedQty;
        } else {
            this.enteredData.shelfQty = 0;
            this.enteredData.shippedQty = 0;
        }

        this.enteredData.qty = this.adjustmentProvider.getItemPendingPhysicalQty(this.enteredData.item, this.enteredData.location);

        this.enteredData.qty++;
        this.showQty = true;
    }

    nextLocation() {
        if (this.enteredData.item != "" && this.enteredData.qty > 0) {
            this.addAdjustmentItem();
        }

        this.resetForm();
    }

    nextItem() {
        if (this.enteredData.item != "" && this.enteredData.qty >= 0) {
            this.addAdjustmentItem();
        }

        this.enteredData.item = "";
        this.enteredData.qty = 0;
        this.enteredData.shelfQty = 0;
        this.enteredData.shippedQty = 0;
        this.showQty = false;
    }

    addAdjustmentItem(isScan=false) {

        if (this.enteredData.qty - this.enteredData.shelfQty == 0){
            this.utils.showAlert("No Variance", "This item does not have any variance and will not be added to the list");
            this.utils.playPromptSound(isScan);
            return;
        }

        this.adjustmentProvider.addPendingItem(this.enteredData.location, this.enteredData.item, this.enteredData.qty, this.enteredData.shelfQty);
    }

    clearAdjustments(){
        if (Object.keys(this.adjustmentProvider.pendingItems).length > 0) {

            let alert = this.alertCtrl.create({
                title: "Cancel Adjustments",
                message: "Are you sure you want to clear all pending adjustments?",
                buttons: [
                    {
                        text: "Cancel",
                        role: "cancel"
                    },
                    {
                        text: "Yes",
                        handler: ()=> {
                            this.adjustmentProvider.clearPendingItems();
                        }
                    }
                ]
            });

            alert.present();
        }
    }

    commitAdjustments() {

        this.nextLocation();

        if (this.adjustmentProvider.pendingNumItems == 0)
            return this.utils.showAlert("Error", "Add some items to the adjustment list first.");

        this.loader = this.loadingCtrl.create({content: "Submitting Adjustments..."});
        this.loader.present();

        this.adjustmentProvider.commitAdjustment(this.loader).then((res:any)=> {
            this.dismissLoader();
            this.cache.flushItemLocationCache();
            this.utils.showAlert("Adjustment Successful", "Adjustment #" + res.ReferenceNbr.value + " was successfully created" + (res.released ? " and released" : ""));
        }).catch((err)=> {
            this.dismissLoader();
            this.utils.playFailedSound();
            this.utils.processApiError("Error", err.message, err, this.navCtrl, this.adjustmentProvider.getErrorReportingData());
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

        this.zone.run(()=> {

            if (this.enteredData.location == "") {
                this.setLocation(barcodeText, true, callback);
                return;
            }

            this.showLoaderDelayed("Loading...");

            // If the location and to-location is already set, scanning a bin barcode updates the to-location
            this.cache.getBinById(barcodeText).then((bin)=> {
                this.dismissLoader();
                // check if quantity is set. If it is then save the current entry
                if (this.enteredData.location != "" && this.enteredData.item != "" && this.enteredData.qty > 0) {
                    this.addAdjustmentItem(true);
                }

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

                        this.enteredData.qty++;
                        this.utils.playScanSuccessSound();

                        if (callback != null)
                            callback();

                    } else {
                        this.addAdjustmentItem();

                        this.setItem(item.InventoryID.value, true, callback);
                    }
                }).catch((err) => {
                    this.dismissLoader();
                    this.utils.showAlert("Error", err.message);
                    this.utils.playFailedSound(true);
                });
            });
        });
    }

}
