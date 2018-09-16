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
import { IonicPage, NavController, NavParams, ViewController, Events, AlertController } from 'ionic-angular';
import { AdjustmentProvider } from '../../../providers/app/adjustment'
import { CacheProvider } from "../../../providers/core/cache";
import { LoadingController } from "ionic-angular/index";
import { UtilsProvider } from "../../../providers/core/utils";

/**
 * Generated class for the PickShipmentsPickPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

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
        bookQty: 0
    };

    currentLocationItems = {};

    showQty = false;

    loader = null;
    loaderTimer = null;

    constructor(private zone:NgZone,
                public navCtrl:NavController,
                public navParams:NavParams,
                public adjustmentProvider:AdjustmentProvider,
                public cache:CacheProvider,
                public viewCtrl:ViewController,
                public events:Events,
                public alertCtrl:AlertController,
                public loadingCtrl:LoadingController,
                public utils:UtilsProvider) {

    }

    ionViewDidLoad() {
        this.events.subscribe('barcode:scan', (barcodeText)=>{
            this.onBarcodeScan(barcodeText);
        });
        this.events.subscribe('adjustments:commit', ()=>{
            this.commitAdjustments();
        });
    }

    ionViewWillUnload(){
        this.events.unsubscribe('barcode:scan');
        this.events.unsubscribe('adjustments:commit');
    }

    resetForm() {

        this.enteredData = {
            location: "",
            item: "",
            qty: 0,
            bookQty: 0
        };

        this.currentLocationItems = {};

        this.showQty = false;

        this.locationInput.setFocus();
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

    setLocation(locId, isScan=false) {

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

    setItem(itemId, isScan=false) {

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
        this.enteredData.bookQty = this.currentLocationItems.hasOwnProperty(this.enteredData.item) ? this.currentLocationItems[this.enteredData.item].QtyOnHand.value : 0;
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
        if (this.enteredData.item != "" && this.enteredData.qty > 0) {
            this.addAdjustmentItem();
        }

        this.enteredData.item = "";
        this.enteredData.qty = 0;
        this.enteredData.bookQty = 0;
        this.showQty = false;
    }

    addAdjustmentItem(isScan=false) {

        if (this.enteredData.qty - this.enteredData.bookQty == 0){
            this.utils.showAlert("No Variance", "This item does not have any variance and will not be added to the list");
            this.utils.playPromptSound(isScan);
            return;
        }

        this.adjustmentProvider.addPendingItem(this.enteredData.location, this.enteredData.item, this.enteredData.qty, this.enteredData.bookQty);
    }

    commitAdjustments() {

        this.nextLocation();

        if (this.adjustmentProvider.pendingNumItems == 0)
            return this.utils.showAlert("Error", "Add some items to the adjustment list first.");

        this.loader = this.loadingCtrl.create({content: "Submitting Adjustments..."});
        this.loader.present();

        this.adjustmentProvider.commitAdjustment(this.loader).then(()=> {
            this.dismissLoader();
            this.cache.flushItemLocationCache();
        }).catch((err)=> {
            this.dismissLoader();
            this.utils.playFailedSound();
            this.utils.processApiError("Error", err.message, err, this.navCtrl, this.adjustmentProvider.getErrorReportingData());
        });
    }

    onBarcodeScan(barcodeText) {

        console.log(barcodeText);

        if (this.enteredData.location == "") {
            this.setLocation(barcodeText, true);
            return;
        }

        this.showLoaderDelayed("Loading...");

        // If the location and to-location is already set, scanning a bin barcode updates the to-location
        this.cache.getBinById(barcodeText).then((bin)=> {
            // check if quantity is set. If it is then save the current entry
            if (this.enteredData.location != "" && this.enteredData.item != "" && this.enteredData.qty > 0) {
                this.addAdjustmentItem(true);
            }

            this.setLocation(barcodeText, true);
        }).catch((err) => {

            this.cache.getItemById(barcodeText).then((item:any)=> {

                if (this.enteredData.item == "" || this.enteredData.qty == 0) {
                    this.setItem(item.InventoryID.value, true);
                    return;
                }

                // If the item is the same as the last item, increment quantity.
                if (item.InventoryID.value == this.enteredData.item) {
                    this.zone.run(()=> {
                        this.enteredData.qty++;
                        this.utils.playScanSuccessSound();
                        this.dismissLoader();
                    });
                } else {
                    this.addAdjustmentItem();

                    this.setItem(item.InventoryID.value, true);
                }
            }).catch((err) => {
                this.utils.showAlert("Error", err.message);
                this.utils.playFailedSound(true);
            });
        });
    }

}
