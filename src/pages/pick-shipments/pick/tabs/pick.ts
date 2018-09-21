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
import { IonicPage, NavController, NavParams, ViewController, Events, AlertController, LoadingController } from 'ionic-angular';
import { PickProvider } from '../../../../providers/providers';
import { CacheProvider } from "../../../../providers/core/cache";
import { UtilsProvider } from "../../../../providers/core/utils";
import { BarcodeScanner } from '@ionic-native/barcode-scanner';

@IonicPage()
@Component({
    selector: 'tabs-pick',
    templateUrl: 'pick.html'
})
export class PickTab {

    @ViewChild('location') locationInput;
    @ViewChild('item') itemInput;
    @ViewChild('lot') lotInput;
    @ViewChild('qty') qtyInput;

    currentLocationIndex = 0;
    currentItemIndex = 0;

    //serialTracked = false;

    enteredData:any = {
        location: "",
        item: "",
        qty: 0
    };

    //showLot = false;
    showQty = false;

    loader = null;
    loaderTimer = null; // Use this to prevent loader popping up for cached items/locations

    itemAvailability = {};

    constructor(public navCtrl:NavController,
                public navParams:NavParams,
                public pickProvider:PickProvider,
                public cache:CacheProvider,
                public viewCtrl:ViewController,
                public events:Events,
                public alertCtrl:AlertController,
                public loadingCtrl: LoadingController,
                private ngZone: NgZone,
                public utils:UtilsProvider,
                public barcodeScanner:BarcodeScanner) {

    }

    ionViewDidLoad() {

        this.events.subscribe('barcode:scan', (barcodeText)=>{
            this.onBarcodeScan(barcodeText)
        });

        this.events.subscribe('picks:confirm', ()=>{
            this.confirmPicks();
        });

        this.events.subscribe('picks:cancel', ()=>{
            this.cancelPicks();
        });
        this.events.subscribe('picks:open', (indexes)=>{
            this.openPicklistItem(indexes);
        });

        if (this.pickProvider.hasSavedPicks()) {

            this.utils.playPromptSound();

            let alert = this.alertCtrl.create({
                title: "Load saved picks",
                message: "There are unconfirmed picks available for this shipment. Do you want to continue from where you left off?",
                buttons: [
                    {
                        text: "No",
                        role: "cancel",
                        handler: ()=> {
                            this.pickProvider.clearSavedPicks();
                        }
                    },
                    {
                        text: "Yes",
                        handler: ()=> {
                            this.pickProvider.loadSavedPicks();
                        }
                    }
                ]
            });

            alert.present();
        }
    }

    ionViewWillUnload(){
        this.events.unsubscribe('barcode:scan');
        this.events.unsubscribe('picks:confirm');
        this.events.unsubscribe('picks:cancel');
        this.events.unsubscribe('picks:open');
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

    openPicklistItem(indexes){
        this.currentLocationIndex = indexes[0];
        this.currentItemIndex = indexes[1];

        // Set location & item to suggested
        var item = this.getSuggestedAllocation();

        if (!item) return;

        var context = this;

        this.setLocation(item.LocationID.value, false, function(){
            context.setItem(item.InventoryID.value);
        });
    }

    getSuggestedLocation() {
        var location = this.pickProvider.getSuggestedLocation(this.currentLocationIndex);

        if (!location){
            this.currentLocationIndex = 0;
            this.currentItemIndex = 0;
            return this.pickProvider.getSuggestedLocation(this.currentLocationIndex);
        }

        return location;
    }

    getSuggestedAllocation() {
        var item = this.pickProvider.getSuggestedItem(this.currentLocationIndex, this.currentItemIndex);

        if (!item) {
            this.currentLocationIndex = 0;
            this.currentItemIndex = 0;
            return this.pickProvider.getSuggestedItem(this.currentLocationIndex, this.currentItemIndex);
        }

        return item;
    }

    getCurrentAllocPickedQty() {
        var alloc = this.getSuggestedAllocation();
        return this.pickProvider.getPendingAllocationQty(alloc.LineNbr.value, alloc.SplitLineNbr.value);
    }

    getTotalPickedQty(){
        var alloc = this.getSuggestedAllocation();

        return this.pickProvider.getPendingItemQty(alloc.LineNbr.value);
    }

    getSuggestedPickQty() {
        var alloc = this.getSuggestedAllocation();
        // If the location doesn't match the suggested, use the total remaining for that item, or the available
        if (this.enteredData.location !== alloc.LocationID.value){
            var available = this.itemAvailability.hasOwnProperty(this.enteredData.location) ?
                                this.itemAvailability[this.enteredData.location].QtyAvailable.value : 0;

            return Math.min(available, this.getTotalRemainingQty());
        }

        return this.getSuggestedAllocation().RemainingQty;
    }

    getTotalRemainingQty() {
        return this.getSuggestedAllocation().TotalRemainingQty - this.getTotalPickedQty();
    }

    nextItem() {
        if (this.currentItemIndex + 1 < this.getSuggestedLocation().Items.length) {

            this.currentItemIndex++;

        } else if (this.currentLocationIndex + 1 < this.pickProvider.pickList.length) {

            this.currentLocationIndex++;
            this.currentItemIndex = 0;

        } else {

            this.currentLocationIndex = 0;
            this.currentItemIndex = 0;
        }

        console.log(this.currentLocationIndex + " / " + this.currentItemIndex);
        console.log(this.getSuggestedAllocation());
    }

    previousItem() {
        if (this.currentItemIndex - 1 > -1) {

            this.currentItemIndex--;

        } else if (this.currentLocationIndex - 1 > -1) {

            this.currentLocationIndex--;
            this.currentItemIndex = this.getSuggestedLocation().Items.length - 1;

        } else {

            this.currentLocationIndex = this.pickProvider.pickList.length - 1;
            this.currentItemIndex = this.getSuggestedLocation().Items.length - 1;
        }
    }

    resetForm(keepLocation, focus) {

        if (!keepLocation)
            this.enteredData.location = "";

        this.enteredData.item = "";
        //this.enteredData.lot = "";
        this.enteredData.qty = 0;

        if (focus)
            this.locationInput.setFocus();

        this.showQty = false;
    }

    setLocation(locId, isScan=false, callback=null) {

        if (locId) {
            this.enteredData.location = locId;
        }

        if (this.enteredData.location == "") {
            this.utils.showAlert("Error", "Please enter a location");
            return;
        }

        this.showLoaderDelayed("Loading...");

        this.cache.getBinById(this.enteredData.location).then((bin:any)=>{

            // check if sales are allowed from this location
            if (!bin.SalesAllowed.value){
                this.showQty = false;
                this.enteredData.location = "";
                this.utils.playFailedSound(isScan);
                this.dismissLoader().then(()=>{
                    this.utils.showAlert("Error", "Sales are not allowed from location "+bin.Description.value+" ("+bin.LocationID+")");
                });
                return;
            }

            this.dismissLoader();

            var curItem = this.getSuggestedAllocation();

            if (this.enteredData.item != "" && curItem.LocationID.value != this.enteredData.location){
                // try find another allocation which matches this location
                var allocIndexes = this.pickProvider.getBestFitAllocation(this.enteredData.item, this.enteredData.location);

                if (allocIndexes != null){
                    this.currentLocationIndex = allocIndexes[0];
                    this.currentItemIndex = allocIndexes[1];
                }
            }

            // if the item is already set, verify location item availability and prompt for bin override.
            if (this.enteredData.item == ""){
                if (isScan)
                    this.utils.playScanSuccessSound();
            } else {
                if (!this.verifyLocation(isScan)){
                    this.showQty = false;
                    this.enteredData.location = "";
                    return;
                }
            }

            if (callback != null)
                callback();

            if (locId)
                return;
            //document.getElementById("item").focus();
            setTimeout(()=> {
                try { this.itemInput.setFocus(); }catch(e){}
            });

        }).catch((err)=>{
            this.showQty = false;
            this.enteredData.location = "";
            this.utils.playFailedSound(isScan);
            this.dismissLoader().then(()=>{
                this.utils.showAlert("Error", err.message, {exception: err});
            });
        });

    }

    setItem(itemId, isScan=false, callback=null) {

        if (itemId) {
            this.enteredData.item = itemId;
        }

        if (this.enteredData.item == "") {
            this.utils.showAlert("Error", "Please enter an item");
            return;
        }

        this.showLoaderDelayed("Loading...");

        this.cache.getItemById(this.enteredData.item).then((item:any)=> {

            var curItem = this.getSuggestedAllocation();

            if (item.InventoryID.value != curItem.InventoryID.value) {
                // Search the picklist for the item & load the best match
                var allocIndexes = this.pickProvider.getBestFitAllocation(item.InventoryID.value, this.enteredData.location);

                if (allocIndexes == null){
                    this.showQty = false;
                    this.enteredData.item = "";
                    this.enteredData.qty = 0;
                    this.utils.playFailedSound(isScan);
                    this.dismissLoader().then(()=> {
                        this.utils.showAlert("Error", "The item does not exist on the picklist or has already been picked.");
                    });
                    return;
                }

                this.currentLocationIndex = allocIndexes[0];
                this.currentItemIndex = allocIndexes[1];
            }

            this.pickProvider.getItemAvailabilty(item.InventoryID.value).then((res)=>{

                this.itemAvailability = res;

                this.dismissLoader();

                if (this.verifyLocation(isScan)){

                    this.showQty = true;
                    this.enteredData.qty = 1;
                    this.enteredData.item = item.InventoryID.value;

                    if (callback != null)
                        callback();

                    if (itemId)
                        return;

                    setTimeout(()=> {
                        try { this.qtyInput.setFocus(); }catch(e){}
                    }, 500);

                }

            }).catch((err)=>{
                this.showQty = false;
                this.enteredData.item = "";
                this.utils.playFailedSound(isScan);
                this.dismissLoader().then(()=>{
                    this.utils.showAlert("Error", "Failed to load item availability: "+err.message, {exception: err});
                });
            });

        }).catch((err)=> {
            this.showQty = false;
            this.enteredData.item = "";
            this.utils.playFailedSound(isScan);
            this.dismissLoader().then(()=>{
                this.utils.showAlert("Error", err.message, {exception: err});
            });
        });
    }

    private verifyLocation(isScan=false){

        var enteredBin = this.enteredData.location;

        // Validate bin has available qty
        var onhandQty = this.itemAvailability.hasOwnProperty(enteredBin) ? this.itemAvailability[enteredBin].QtyOnHand.value : 0;

        if (onhandQty == 0){
            this.utils.playFailedSound(isScan);
            this.utils.showAlert("Error", "There is no stock available for the current item and location. Please choose a different location or add an adjustment first.");
            return false;
        }

        var curBin = this.getSuggestedAllocation().LocationID.value;

        // If the bin is not the suggested bin, prompt for override
        if (curBin != enteredBin) {

            this.utils.playPromptSound(isScan);

            let alert = this.alertCtrl.create({
                title: "Override Bin",
                message: enteredBin + " is not a recommended bin (" + curBin + ") for this item, override?",
                buttons: [
                    {
                        text: "No",
                        role: "cancel",
                        handler: ()=> {
                            this.enteredData.location = curBin;
                        }
                    },
                    {
                        text: "Yes",
                        handler: ()=> {
                        }
                    }
                ]
            });

            alert.present();

            return true;
        }

        if (isScan)
            this.utils.playScanSuccessSound();

        return true;
    }

    private verifyAvailability(addQty=0){

        var validateQty = parseFloat(this.enteredData.qty) + addQty;

        if (validateQty > this.getTotalRemainingQty()) {
            this.utils.showAlert("Error", "The entered quantity exceeds the quantity needed for this item.");
            return false;
        }

        var curAlloc = this.getSuggestedAllocation();

        // check availability
        var availability = this.itemAvailability.hasOwnProperty(this.enteredData.location) ? this.itemAvailability[this.enteredData.location] : 0;

        if (availability == null){

            this.utils.showAlert("Error", "There is no stock available for the current item and location. Please choose a different location or add an adjustment first.");
            return false;
        } else {

            // Make sure there is enough available and on-hand stock for the unallocated quantity
            var onhandQty =  availability.QtyOnHand.value;
            var availableQty = availability.QtyAvailable.value;
            var allocatedQty = curAlloc.LocationID.value == this.enteredData.location ? curAlloc.Qty.value : 0;
            var unallocatedQty = validateQty - allocatedQty;

            if (unallocatedQty > 0){

                if (unallocatedQty > onhandQty){
                    this.utils.showAlert("Error", "There is is only " + onhandQty + " on-hand units for the current location. Please alter quantity, choose a different location or add an adjustment first.");
                    return false;
                }

                if (unallocatedQty > availableQty){
                    this.utils.showAlert("Error", "There is is only " + availableQty + " available units for the current location. Please alter quantity, choose a different location or add an adjustment first.");
                    return false;
                }
            }
        }

        return true;
    }

    addPick(isScan=false) {

        for (var i in this.enteredData) {
            if (this.enteredData[i] == "") {

                //if (i == "lot" && !this.serialTracked)
                    //continue;

                this.utils.playFailedSound(true);
                this.utils.showAlert("Error", "Please enter all required fields.");
                return false;
            }
        }

        // validate qty
        if (this.enteredData.qty < 1) {
            this.utils.playFailedSound(true);
            this.utils.showAlert("Error", "Quantity must be greater than 0.");
            return false;
        }

        if (this.enteredData.qty > this.getTotalRemainingQty()) {
            this.utils.playFailedSound(true);
            this.utils.showAlert("Error", "The entered quantity exceeds the quantity needed for this item.");
            return false;
        }

        if (!this.verifyAvailability()){
            this.utils.playFailedSound(true);
            return false;
        }

        console.log(JSON.stringify(this.enteredData));

        var data = {
            location: this.enteredData.location,
            item: this.enteredData.item,
            //lot: this.enteredData.lot,
            qty: this.enteredData.qty
        };

        var curAlloc = this.getSuggestedAllocation();

        this.pickProvider.addPick(data, curAlloc);

        var newAlloc = this.getSuggestedAllocation();

        this.resetForm((newAlloc != null && curAlloc.LocationID.value == newAlloc.LocationID.value), !isScan);

        if (!newAlloc) {
            let alert = this.alertCtrl.create({
                title: "Picking Complete",
                message: "All items have been picked, would you like to confirm them?",
                buttons: [
                    {
                        text: "Cancel",
                        role: "cancel"
                    },
                    {
                        text: "OK",
                        handler: ()=> {
                            alert.dismiss();
                            this.confirmPicks();
                        }
                    }
                ]
            });
            alert.present();
        }

        return true;
    }

    cancelPicks() {

        if (Object.keys(this.pickProvider.pendingPicks).length > 0) {

            let alert = this.alertCtrl.create({
                title: "Cancel picks",
                message: "Yo bro, are you sure you want to can all pending picks?",
                buttons: [
                    {
                        text: "Cancel",
                        role: "cancel"
                    },
                    {
                        text: "Yes",
                        handler: ()=> {
                            this.pickProvider.clearSavedPicks();
                            this.events.publish('closeModal');
                        }
                    }
                ]
            });

            alert.present();

            return;

        }

        this.events.publish('closeModal');

    }

    confirmPicks() {

        if (this.enteredData.item != "" &&  this.enteredData.location != "" && this.enteredData.qty > 0) {
            if (!this.addPick())
                return;
        }

        if (Object.keys(this.pickProvider.pendingPicks).length == 0)
            return this.utils.showAlert("Error",  "There are no picked items to commit.");

        let loader = this.loadingCtrl.create({content: "Confirming picks..."});
        loader.present();

        this.pickProvider.confirmPicks().then((res:any)=>{
            loader.dismiss();
            this.cache.flushItemLocationCache();
            this.events.publish('closeModal');
        }).catch((err)=> {
            loader.dismiss();
            this.utils.processApiError("Error", err.message, err, this.navCtrl, this.pickProvider.getErrorReportingData());
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

    onBarcodeScan(barcodeText, callback=null){

        console.log(barcodeText);

        this.ngZone.run(()=> {

            if (this.enteredData.location == "") {
                this.ngZone.run(()=> {
                    this.setLocation(barcodeText, true, callback);
                });
                return;
            }

            this.showLoaderDelayed("Loading...");

            this.cache.getBinById(barcodeText).then((bin:any)=> {

                this.dismissLoader();

                this.ngZone.run(()=> {
                    // check if quantity is set. If it is then save the current entry
                    if (barcodeText != this.enteredData.location && this.enteredData.item != "" && this.enteredData.qty > 0) {
                        if (!this.addPick(true))
                            return;
                    }

                    this.setLocation(barcodeText, true, callback);
                });

            }).catch((err) => {

                this.cache.getItemById(barcodeText).then((item:any)=> {

                    this.dismissLoader();

                    if (this.enteredData.item == "" || this.enteredData.qty == 0) {
                        this.setItem(item.InventoryID.value, true, callback);
                        return;
                    }

                    // If the item is the same as the last item, validate & increment quantity.
                    if (item.InventoryID.value == this.enteredData.item) {

                        if (!this.verifyAvailability(1)) {
                            this.utils.playFailedSound(true);
                            return;
                        }

                        this.enteredData.qty++;

                        this.utils.playScanSuccessSound();

                        // If the completed quantity is reached let's automatically move to the next suggested pick
                        if (this.getTotalRemainingQty() - this.enteredData.qty == 0) {
                            return this.addPick(true);
                        }

                        if (callback != null)
                            callback();

                    } else {
                        if (this.addPick(true))
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
