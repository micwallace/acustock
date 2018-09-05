import { Component, ViewChild, NgZone } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, Events, AlertController, LoadingController } from 'ionic-angular';
import { PickProvider } from '../../../../providers/providers';
import { CacheProvider } from "../../../../providers/core/cache";
import { UtilsProvider } from "../../../../providers/core/utils";
import { BarcodeScanner } from '@ionic-native/barcode-scanner';

/**
 * Generated class for the PickShipmentsPickPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

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

    serialTracked = false;

    enteredData = {
        location: "",
        item: "",
        qty: 0
    };

    showLot = false;
    showQty = false;

    loader = null;
    loaderTimer = null; // Use this to prevent loader popping up for cached items/locations

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

        this.setLocation(item.LocationID.value);
        this.setItem(item.InventoryID.value);

        setTimeout(()=> {
            try { this.qtyInput.setFocus(); }catch(e){}
        }, 500);
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
        return Math.min((this.getSuggestedAllocation().RemainingQty - this.getCurrentAllocPickedQty()), this.getTotalRemainingQty());
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

            // prompt to overrride if it's not the suggested location
            if ((this.enteredData.item == "" || this.verifyLocation(isScan)) && isScan){
                this.utils.playScanSuccessSound();

                if (callback != null)
                    callback();
            }

            if (locId)
                return;
            //document.getElementById("item").focus();
            setTimeout(()=> {
                try { this.itemInput.setFocus(); }catch(e){}
            });

        }).catch((err)=>{
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

            this.dismissLoader();

            this.showQty = true;
            this.enteredData.qty = 1;
            this.enteredData.item = item.InventoryID.value;

            if (this.verifyLocation(isScan) && isScan){
                this.utils.playScanSuccessSound();

                if (callback != null)
                    callback();
            }

            if (itemId)
                return;

            setTimeout(()=> {
                try { this.qtyInput.setFocus(); }catch(e){}
            }, 500);

        }).catch((err)=> {
            this.enteredData.item = "";
            this.utils.playFailedSound(isScan);
            this.dismissLoader().then(()=>{
                this.utils.showAlert("Error", err.message, {exception: err});
            });
        });
    }

    private verifyLocation(isScan=false){

        var curBin = this.getSuggestedAllocation().LocationID.value;
        var enteredBin = this.enteredData.location;
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
                            // TODO: Validate bin & available qty
                        }
                    }
                ]
            });

            alert.present();

            return false;
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
            this.utils.processApiError("Error", err.message, err, this.navCtrl);
        });
    }

    startCameraScanner(){
        this.barcodeScanner.scan().then((barcodeData) => {
            if (barcodeData.cancelled)
                return;

            this.onBarcodeScan(barcodeData.text, function(){
                this.startCameraScanner();
            });

        }, (err) => {
            // An error occurred
            this.utils.showAlert("Error", "Error accessing barcode device: " + err, {exception: err});
        });
    }

    onBarcodeScan(barcodeText, callback=null){
        console.log(barcodeText);

        if (this.enteredData.location == "") {
            this.ngZone.run(()=> {
                this.setLocation(barcodeText, true, callback);
            });
            return;
        }

        this.showLoaderDelayed("Loading...");

        this.cache.getBinById(barcodeText).then((bin:any)=> {

            this.ngZone.run(()=> {
                // check if quantity is set. If it is then save the current entry
                if (this.enteredData.item != "" && this.enteredData.qty > 0) {
                    if (!this.addPick(true))
                        return;
                }

                this.setLocation(barcodeText, true, callback);
            });

        }).catch((err) => {

            this.cache.getItemById(barcodeText).then((item:any)=> {

                this.ngZone.run(()=> {

                    if (this.enteredData.item == "" || this.enteredData.qty == 0) {
                        this.setItem(item.InventoryID.value, true, callback);
                        return;
                    }

                    // If the item is the same as the last item, validate & increment quantity.
                    if (item.InventoryID.value == this.enteredData.item) {

                        if (this.getTotalRemainingQty() - (this.enteredData.qty + 1) < 0){
                            this.utils.playFailedSound(true);
                            this.utils.showAlert("Error", "You've already picked the quantity required for this item.");
                            return;
                        }

                        this.enteredData.qty++;

                        this.utils.playScanSuccessSound();

                        // If the completed quantity is reached let's automatically move to the next suggested pick
                        if (this.getTotalRemainingQty() - this.enteredData.qty == 0){
                            return this.addPick(true);
                        }

                        if (callback != null)
                            callback();

                    } else {
                        if (this.addPick(true))
                            this.setItem(item.InventoryID.value, true, callback);
                    }

                });

            }).catch((err) => {
                this.utils.playFailedSound(true);
                this.utils.showAlert("Error", err.message);
            });

        });
    }

}
