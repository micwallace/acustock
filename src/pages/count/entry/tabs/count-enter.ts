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
import { IonicPage, NavController, Events, AlertController, PopoverController, Tabs, App, LoadingController } from 'ionic-angular';
import { CountProvider } from '../../../../providers/app/count'
import { CacheProvider } from "../../../../providers/core/cache";
import { UtilsProvider } from "../../../../providers/core/utils";
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { CountPopover } from "../../count-popover";

@IonicPage()
@Component({
    selector: 'page-count-entry',
    templateUrl: 'count-enter.html'
})
export class CountEntryEnterTab {

    @ViewChild('location') locationInput;
    @ViewChild('item') itemInput;
    @ViewChild('qty') qtyInput;

    enteredData = {
        location: "",
        item: "",
        qty: 0
    };

    currentSourceLine = null;

    showItem = false;
    showQty = false;

    loader = null;
    loaderTimer = null;

    constructor(private zone:NgZone,
                public navCtrl:NavController,
                public appCtrl:App,
                public countProvider:CountProvider,
                public cache:CacheProvider,
                public events:Events,
                public alertCtrl:AlertController,
                public loadingCtrl:LoadingController,
                public utils:UtilsProvider,
                public barcodeScanner:BarcodeScanner,
                public popoverCtrl:PopoverController) {

    }

    barcodeScanHandler = (barcodeText)=>{
        let tabs: Tabs = this.navCtrl.parent;
        if (tabs.selectedIndex !== 0)
            tabs.select(0, {});

        this.onBarcodeScan(barcodeText)
    };

    ionViewDidLoad() {

        this.events.unsubscribe('barcode:scan');
        this.events.subscribe('barcode:scan', this.barcodeScanHandler);

        this.events.subscribe('counts:commit', ()=>{
            this.commitCounts();
        });

        this.events.subscribe('counts:clear', ()=>{
            this.clearCounts();
        });

        this.events.subscribe('counts:open', (item)=>{
            this.enteredData.location = item.LocationID.value;
            this.enteredData.item = item.InventoryID.value;
            this.setCountLine().then();
        });

        if (this.countProvider.hasSavedCounts()) {

            let alert = this.alertCtrl.create({
                title: "Load saved counts",
                message: "There are unconfirmed counts available. Do you want to continue from where you left off?",
                buttons: [
                    {
                        text: "No",
                        role: "cancel",
                        handler: ()=> {
                            this.countProvider.clearSavedCounts();
                        }
                    },
                    {
                        text: "Yes",
                        handler: ()=> {
                            this.countProvider.loadSavedCounts();
                        }
                    }
                ]
            });

            alert.present();
        }
    }

    ionViewWillUnload(){
        this.events.unsubscribe('counts:commit');
        this.events.unsubscribe('counts:clear');
        this.events.unsubscribe('counts:open');
    }

    presentPopover(event) {
        let popover = this.popoverCtrl.create(CountPopover);
        popover.present({ev:event});
    }

    clearCounts(){

        if (Object.keys(this.countProvider.pendingCounts).length > 0) {

            let alert = this.alertCtrl.create({
                title: "Clear Counts",
                message: "Are you sure you want to clear all pending count items?",
                buttons: [
                    {
                        text: "Cancel",
                        role: "cancel"
                    },
                    {
                        text: "Yes",
                        handler: ()=> {
                            this.countProvider.clearSavedCounts();
                        }
                    }
                ]
            });

            alert.present();
        }
    }

    cancelForm(){

        let alert = this.alertCtrl.create({
            title: "Cancel",
            message: "Are you sure you want to cancel the current item?",
            buttons: [
                {
                    text: "No",
                    role: "cancel",
                    handler: ()=> {
                    }
                },
                {
                    text: "Yes",
                    handler: ()=> {
                        this.resetForm();
                    }
                }
            ]
        });

        alert.present();
    }

    resetForm() {

        this.enteredData.item = "";
        this.enteredData.qty = 0;

        this.currentSourceLine = null;

        this.showItem = false;
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

        this.showLoaderDelayed("Loading...");

        this.showQty = false;

        this.cache.getBinById(locId).then((bin)=> {

            this.showItem = true;

            /*if (this.enteredData.item != "") {
                this.showQty = true;
                this.enteredData.qty = 1;
            }*/

            this.dismissLoader();

            if (isScan)
                this.utils.playScanSuccessSound();

            if (callback != null)
                callback();

        }).catch((err) => {

            this.enteredData.location = "";
            this.showItem = false;
            this.dismissLoader().then(()=> {
                this.utils.showAlert("Error", err.message);
            });

            this.utils.playFailedSound(isScan);
        });

    }

    setItem(itemId, isScan=false, callback=null) {

        if (itemId) {
            this.enteredData.item = itemId;
        } else {
            itemId = this.enteredData.item;
        }

        this.currentSourceLine = null;

        this.showLoaderDelayed("Loading...");

        this.cache.getItemById(itemId).then((item:any)=> {

            this.dismissLoader();

            this.enteredData.item = item.InventoryID.value;

            if (this.enteredData.location != "") {

                this.setCountLine(isScan).then(()=> {

                    if (isScan)
                        this.utils.playScanSuccessSound();

                    if (callback != null)
                        callback();

                }).catch((err) => {
                    this.showQty = false;
                    this.enteredData.item = "";
                });
            }

        }).catch((err) => {
            this.showQty = false;
            this.enteredData.item = "";
            this.dismissLoader().then(()=> {
                this.utils.showAlert("Error", err.message);
            });

            this.utils.playFailedSound(isScan);
        });
    }

    setCountLine(isScan = false){

        return new Promise((resolve, reject)=>{

            // get count line based on the currently entered data
            let line = this.countProvider.getCountLine(this.enteredData);

            if (line != null) {
                this.currentSourceLine = line;
                this.showQty = true;
                this.enteredData.qty = 1;
                return resolve(line);
            }

            let alertDialog = this.alertCtrl.create({
                title: "Create Count Line",
                message: "There is no count line which matches the currently entered item/location. Create a new line?",
                buttons: [
                    {
                        text: "No",
                        role: "cancel",
                        handler: ()=> {
                            this.enteredData.item = "";
                        }
                    },
                    {
                        text: "Yes",
                        handler: ()=> {

                            this.loader = this.loadingCtrl.create({content: "Adding line..."});
                            this.loader.present();

                            this.countProvider.addNewCountLine(this.enteredData).then((line)=>{

                                this.currentSourceLine = line;
                                this.showQty = true;
                                this.enteredData.qty = 1;

                                this.dismissLoader();

                                resolve(line);

                            }).catch((err)=>{

                                this.dismissLoader().then(()=>{
                                    this.utils.processApiError("Error", err.message, err, this.appCtrl.getRootNav(), this.countProvider.getErrorReportingData());
                                });

                                this.utils.playFailedSound();
                            });
                        }
                    }
                ]
            });

            alertDialog.present();

            this.utils.playPromptSound(isScan);
        });
    }

    getBookQty(){
        if (this.currentSourceLine == null)
            return -1;

        return this.currentSourceLine.BookQuantity.value;
    }

    getPendingQty(){
        if (this.currentSourceLine == null)
            return -1;

        let key = this.currentSourceLine.InventoryID.value + "-" + this.currentSourceLine.LocationID.value;

        return this.countProvider.getPendingQty(key);
    }

    getCountedQty(){
        if (this.currentSourceLine == null)
            return -1;

        let key = this.currentSourceLine.InventoryID.value + "-" + this.currentSourceLine.LocationID.value;

        return this.countProvider.getPendingQty(key);
    }

    nextLocation() {
        if (this.enteredData.item != "" && this.enteredData.qty > 0) {
            this.addCountItem();
        }
    }

    addCountItem() {

        //this.countProvider.addItemCount(this.enteredData, this.currentSourceLine);
        this.countProvider.setCount(this.currentSourceLine, this.enteredData.qty);

        this.resetForm();

        return true;
    }

    commitCounts() {
        if (this.enteredData.item != "" &&  this.enteredData.location != "" && this.enteredData.qty > 0) {
            if (!this.addCountItem())
                return;
        }

        if (this.countProvider.totalPendingQty == 0)
            return this.utils.showAlert("Error", "Add some items to the receipt list first.");

        this.loader = this.loadingCtrl.create({content: "Submitting Counts..."});
        this.loader.present();

        this.countProvider.commitPendingCounts().then(()=>{
            this.dismissLoader();
            //this.events.publish("closeReceiveScreen");
        }).catch((err)=>{
            this.dismissLoader();
            this.utils.processApiError("Error", err.message, err, this.appCtrl.getRootNav(), this.countProvider.getErrorReportingData());
        });
    }

    startCameraScanner(){

        let context = this;

        this.barcodeScanner.scan({resultDisplayDuration:0}).then((barcodeData) => {
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

        //console.log(barcodeText);

        this.zone.run(()=> {

            this.showLoaderDelayed("Loading...");

            // If the location and to-location is already set, scanning a bin barcode updates the to-location
            this.cache.getBinById(barcodeText).then((bin)=> {

                this.dismissLoader();

                if (barcodeText !== this.enteredData.location && this.enteredData.qty > 0)
                    this.addCountItem();

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
                        this.addCountItem();

                        this.setItem(item.InventoryID.value, true, callback);
                    }
                }).catch((err) => {
                    this.dismissLoader();
                    this.utils.playFailedSound(true);
                    this.utils.showAlert("Error", err.message);
                });

            });

        });

    }

}
