import { Component, ViewChild, NgZone } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, Events, AlertController } from 'ionic-angular';
import { PickProvider } from '../../../providers/providers';
import { CacheProvider } from "../../../providers/cache/cache";
import { LoadingController } from "ionic-angular/index";

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
        lot: "",
        qty: 0
    };

    showLot = false;
    showQty = false;

    constructor(public navCtrl:NavController,
                public navParams:NavParams,
                public pickProvider:PickProvider,
                public cache:CacheProvider,
                public viewCtrl:ViewController,
                public events:Events,
                public alertCtrl:AlertController,
                public loadingCtrl: LoadingController,
                private ngZone: NgZone) {

    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad PickShipmentsPickPage Tab: Pick');

        setTimeout(()=> {
            this.locationInput.setFocus();
        }, 150);

        if (this.pickProvider.hasSavedPicks()) {

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
        this.enteredData.lot = "";
        this.enteredData.qty = 0;

        if (focus)
            this.locationInput.setFocus();

        this.showQty = false;
    }

    setLocation(locId) {

        if (locId) {
            this.enteredData.location = locId;
        }

        var curBin = this.getSuggestedAllocation().LocationID.value;
        var enteredBin = this.enteredData.location;
        if (curBin != enteredBin) {
            alert(enteredBin + " is not the recommended bin " + curBin);
            this.enteredData.location = "";
            return;
            // TODO: allow location overide
        }

        if (locId)
            return;
        //document.getElementById("item").focus();
        setTimeout(()=> {
            this.itemInput.setFocus();
        });
    }

    setItem(itemId) {

        if (itemId) {
            this.enteredData.item = itemId;
        }

        var curItem = this.getSuggestedAllocation();

        this.cache.getItemById(this.enteredData.item).then((item:any)=> {

            if (item.InventoryID.value != curItem.InventoryID.value) {
                // Search the picklist for the item & load the best match
                var allocIndexes = this.pickProvider.getBestFitAllocation(item.InventoryID.value, this.enteredData.location);

                if (allocIndexes == null){
                    this.enteredData.item = "";
                    this.enteredData.qty = 0;
                    alert("The item does not exist on the picklist or has already been picked.");
                    return;
                }

                this.currentLocationIndex = allocIndexes[0];
                this.currentItemIndex = allocIndexes[1];
            }

            this.showQty = true;
            this.enteredData.qty = 1;
            this.enteredData.item = item.InventoryID.value;

            if (itemId)
                return;

            setTimeout(()=> {
                this.qtyInput.setFocus();
            }, 500);

        }).catch((err)=> {
            this.enteredData.item = "";
            alert(err.message);
        });
    }

    setLotSerial() {

    }

    addPick(isScan=false) {

        for (var i in this.enteredData) {
            if (this.enteredData[i] == "") {

                if (i == "lot" && !this.serialTracked)
                    continue;

                alert("Please enter all required fields.");
                return;
            }
        }

        // validate qty
        if (this.enteredData.qty < 1) {
            alert("Quantity must be greater than 0.");
            return;
        }

        if (this.enteredData.qty > this.getTotalRemainingQty()) {
            alert("The entered quantity exceeds the quantity needed for this item.");
            return;
        }

        console.log(JSON.stringify(this.enteredData));

        var data = {
            location: this.enteredData.location,
            item: this.enteredData.item,
            lot: this.enteredData.lot,
            qty: this.enteredData.qty
        };

        var curAlloc = this.getSuggestedAllocation();

        this.pickProvider.addPick(data, curAlloc);

        var newAlloc = this.getSuggestedAllocation();

        this.resetForm((newAlloc != null && curAlloc.LocationID.value == newAlloc.LocationID.value), isScan);

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

    }

    cancelPicks() {

        if (Object.keys(this.pickProvider.pendingPicks).length > 0) {

            let alert = this.alertCtrl.create({
                title: "Cancel picks",
                message: "Yo mah dude, are you sure you want to can all pending picks?",
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
        let loader = this.loadingCtrl.create({content: "Confirming picks..."});
        loader.present();

        this.pickProvider.confirmPicks().then((res:any)=>{
            loader.dismissAll();
            this.events.publish('closeModal');
        }).catch((err)=> {
            loader.dismissAll();
            alert(err.message);
        });
    }

    onBarcodeScan(barcodeText){
        console.log(barcodeText);

        if (this.enteredData.location == "") {
            this.ngZone.run(()=> {
                this.setLocation(barcodeText);
                return;
            });
        }

        this.cache.getBinById(barcodeText).then((bin:any)=> {

            this.ngZone.run(()=> {
                // check if quantity is set. If it is then save the current entry
                if (this.enteredData.item != "" && this.enteredData.qty > 0) {
                    this.addPick();
                    return;
                }

                this.setLocation(barcodeText);
            });

        }).catch((err) => {

            this.cache.getItemById(barcodeText).then((item:any)=> {

                this.ngZone.run(()=> {

                    if (this.enteredData.item == "" || this.enteredData.qty == 0) {
                        this.setItem(item.InventoryID.value);
                        return;
                    }

                    // If the item is the same as the last item, validate & increment quantity.
                    if (item.InventoryID.value == this.enteredData.item) {

                        if (this.getTotalRemainingQty() - (this.enteredData.qty + 1) < 0){
                            alert("You've already picked the quantity required for this item.");
                            return;
                        }
                        this.enteredData.qty++;

                        // If the completed quantity is reached let's automatically move to the next suggested pick
                        if (this.getTotalRemainingQty() - this.enteredData.qty == 0){
                            this.addPick(true);
                        }
                    } else {
                        this.addPick(true);

                        this.setItem(item.InventoryID.value);
                    }

                });

            }).catch((err) => {
                alert(err.message);
            });

        });
    }

}
