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
import { TransferProvider } from '../../../providers/app/transfer'
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
    selector: 'page-bin-transfer',
    templateUrl: 'enter.html'
})
export class EnterTab {

    @ViewChild('location') locationInput;
    @ViewChild('tolocation') toLocationInput;
    @ViewChild('item') itemInput;
    @ViewChild('qty') qtyInput;

    enteredData = {
        location: "",
        toLocation: "",
        item: "",
        qty: 0
    };

    currentLocationItems = {};

    showItem = false;
    showQty = false;

    loader = null;
    loaderTimer = null;

    constructor(private zone:NgZone,
                public navCtrl:NavController,
                public navParams:NavParams,
                public transferProvider:TransferProvider,
                public cache:CacheProvider,
                public viewCtrl:ViewController,
                public events:Events,
                public alertCtrl:AlertController,
                public loadingCtrl:LoadingController,
                public utils:UtilsProvider) {


        events.subscribe('barcode:scan', (barcodeText)=>{
            this.onBarcodeScan(barcodeText)
        });
    }

    ionViewDidLoad() {

    }

    resetForm() {

        this.enteredData = {
            location: "",
            toLocation: "",
            item: "",
            qty: 0
        };

        this.currentLocationItems = {};

        this.showItem = false;
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

    setLocation(locId, isScan) {

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

            // check if transfers are allowed from this location
            if (!bin.TransfersAllowed.value){
                this.showQty = false;
                this.enteredData.location = "";
                this.utils.playFailedSound(isScan);
                this.dismissLoader().then(()=>{
                    this.utils.showAlert("Error", "Transfers are not allowed from location "+bin.Description.value+" ("+bin.LocationID+")");
                });
                return;
            }

            this.cache.getLocationItems(locId).then((itemIndex:any)=> {

                this.currentLocationItems = itemIndex;

                //document.getElementById("item").focus();
                this.enteredData.toLocation = "";
                this.showItem = false;
                this.showQty = false;
                this.toLocationInput.setFocus();

                this.dismissLoader();

                if (isScan)
                    this.utils.playScanSuccessSound();

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

    setToLocation(locId, isScan) {


        if (locId) {
            this.enteredData.toLocation = locId;
        } else {
            locId = this.enteredData.toLocation;
        }

        if (locId == "") {
            this.utils.showAlert("Error", "Please enter a location");
            return;
        }

        if (this.enteredData.location == locId) {
            this.showQty = false;
            this.enteredData.location = "";
            this.utils.showAlert("Error", "From and to location must be different");
            return;
        }

        this.showLoaderDelayed("Loading...");

        this.cache.getBinById(locId).then((bin)=> {

            this.enteredData.item = "";
            this.showItem = true;
            this.showQty = false;
            setTimeout(()=> {
                this.itemInput.setFocus();
            });

            this.dismissLoader();

            if (isScan)
                this.utils.playScanSuccessSound();

        }).catch((err) => {
            this.showQty = false;
            this.enteredData.toLocation = "";
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

            // Check that the item is available
            if (!this.currentLocationItems.hasOwnProperty(item.InventoryID.value)) {
                this.utils.playFailedSound(isScan);
                this.utils.showAlert("Error", "There is no quantity on-hand to transfer for the item and location combination.");
                this.showQty = false;
                this.enteredData.item = "";
                return;
            }

            if (!this.validateItemQty(1)) {
                this.utils.playFailedSound(isScan);
                return;
            }

            this.enteredData.item = item.InventoryID.value; // change alternate IDs like barcodes to primary ID
            this.enteredData.qty = 1;
            this.showQty = true;
            setTimeout(()=> {
                this.qtyInput.setFocus();
            });

            if (isScan)
                this.utils.playScanSuccessSound();

        }).catch((err) => {
            this.showQty = false;
            this.enteredData.item = "";
            this.utils.playFailedSound(isScan);
            this.dismissLoader().then(()=> {
                this.utils.showAlert("Error", err.message, {exception: err});
            });
        });
    }

    validateItemQty(qty:any) {
        var reqQty = qty ? qty : this.enteredData.qty;
        var srcQty = this.currentLocationItems.hasOwnProperty(this.enteredData.item) ? this.currentLocationItems[this.enteredData.item].QtyOnHand.value : 0;
        var curPendingQty = this.transferProvider.getItemLocPendingQty(this.enteredData.location, this.enteredData.item);
        if (srcQty < curPendingQty + reqQty) {
            this.utils.showAlert("Error", "There is only " + srcQty + " available for transfer from the current location. " + (curPendingQty ? curPendingQty + " are pending." : ""));
            if (!qty)
                this.enteredData.qty = srcQty - curPendingQty;
            return false;
        }
        return true;
    }

    nextFromBin() {
        if (this.enteredData.item != "" && this.enteredData.qty > 0) {
            this.addTransferItem();
        }

        this.resetForm();
    }

    nextItem() {
        if (this.enteredData.item != "" && this.enteredData.qty > 0) {
            this.addTransferItem();
        }

        this.enteredData.item = "";
        this.enteredData.qty = 0;
        this.showItem = false;
        this.showQty = false;
    }

    addTransferItem() {
        // validate values
        if (!this.validateItemQty(null))
            return;

        var srcQty = this.currentLocationItems.hasOwnProperty(this.enteredData.item) ? this.currentLocationItems[this.enteredData.item].QtyOnHand.value : 0;

        this.transferProvider.addPendingItem(this.enteredData.location, this.enteredData.toLocation, this.enteredData.item, this.enteredData.qty, srcQty);

    }

    commitTransfers() {
        this.nextFromBin();

        if (this.transferProvider.pendingQty == 0)
            return this.utils.showAlert("Error", "Add some items to the transfer list first.");

        this.loader = this.loadingCtrl.create({content: "Submitting Transfers..."});
        this.loader.present();

        this.transferProvider.commitTransfer(this.loader).then(()=> {
            this.dismissLoader();
            this.cache.flushItemLocationCache();
        }).catch((err)=> {
            this.dismissLoader();
            this.utils.playFailedSound();
            this.utils.processApiError("Error", err.message, err, this.navCtrl, this.transferProvider.getErrorReportingData());
        });
    }

    onBarcodeScan(barcodeText) {
        console.log(barcodeText);

        if (this.enteredData.location == "") {
            this.setLocation(barcodeText, true);
            return;
        }

        if (this.enteredData.toLocation == "") {
            this.setToLocation(barcodeText, true);
            return;
        }

        this.showLoaderDelayed("Loading...");

        // If the location and to-location is already set, scanning a bin barcode updates the to-location
        this.cache.getBinById(barcodeText).then((bin)=> {
            // check if quantity is set. If it is then save the current entry
            if (this.enteredData.item != "" && this.enteredData.qty > 0) {
                this.addTransferItem();
            }

            this.setToLocation(barcodeText, true);
        }).catch((err) => {

            this.cache.getItemById(barcodeText).then((item:any)=> {

                if (this.enteredData.item == "" || this.enteredData.qty == 0) {
                    this.setItem(item.InventoryID.value, true);
                    return;
                }

                this.dismissLoader();

                // If the item is the same as the last item, increment quantity.
                if (item.InventoryID.value == this.enteredData.item) {
                    this.zone.run(()=> {
                        this.enteredData.qty++;

                        if (this.validateItemQty(null)){
                            this.utils.playScanSuccessSound();
                        } else {
                            this.utils.playFailedSound(true);
                        }
                    });
                } else {
                    this.addTransferItem();

                    this.setItem(item.InventoryID.value, true);
                }
            }).catch((err) => {
                this.dismissLoader();
                this.utils.showAlert("Error", err.message);
                this.utils.playFailedSound(true);
            });
        });
    }

}
