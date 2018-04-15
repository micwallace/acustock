import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, Events, AlertController } from 'ionic-angular';
import { PickProvider } from '../../../providers/providers';
import { CacheProvider } from "../../../providers/cache/cache";

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

    currentItemIndex = 0;
    currentAllocationIndex = 0;

    serialTracked = false;

    enteredData = {
        location: "",
        item: "",
        lot: "",
        qty: ""
    };

    showLot = false;
    showQty = false;

    constructor(public navCtrl:NavController,
                public navParams:NavParams,
                public pickProvider:PickProvider,
                public cache:CacheProvider,
                public viewCtrl:ViewController,
                public events:Events,
                public alertCtrl:AlertController) {

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

    getCurrentItem() {
        return this.pickProvider.getItemByIndex(this.currentItemIndex);
    }

    getCurrentItemAllocation() {
        return this.pickProvider.getAllocationByIndex(this.currentItemIndex, this.currentAllocationIndex);
    }

    getCurrentItemPickedQty() {
        return this.pickProvider.getItemPickedQty(this.currentItemIndex);
    }

    getSuggestedPickQty(){

        var allocQty = this.getCurrentItemAllocation().Qty.value;
        if (!allocQty)
            return this.getCurrentItemLeftToPickQty();

        return Math.min(this.getCurrentItemLeftToPickQty(), this.getCurrentItemAllocation().Qty.value);
    }

    getCurrentItemLeftToPickQty(){
        return this.getCurrentItem().ShippedQty.value - this.getCurrentItemPickedQty();
    }

    nextItem() {
        if (this.currentAllocationIndex + 1 < this.getCurrentItem().Allocations.length) {

            this.currentAllocationIndex++;

        } else if (this.currentItemIndex + 1 < this.pickProvider.unpickedItems.length) {

            this.currentAllocationIndex = 0;
            this.currentItemIndex++;

        } else {

            this.currentAllocationIndex = 0;
            this.currentItemIndex = 0;
        }
    }

    previousItem() {
        if (this.currentAllocationIndex - 1 > -1) {

            this.currentAllocationIndex--;

        } else if (this.currentItemIndex - 1 > -1) {

            this.currentItemIndex--;
            this.currentAllocationIndex = this.getCurrentItem().Allocations.length - 1;

        } else {

            this.currentItemIndex = this.pickProvider.unpickedItems.length - 1;
            this.currentAllocationIndex = this.getCurrentItem().Allocations.length - 1;
        }
    }

    resetForm() {

        this.enteredData = {
            location: "",
            item: "",
            lot: "",
            qty: ""
        };

        this.locationInput.setFocus();

        this.showQty = false;
    }

    setLocation() {
        var curBin = this.getCurrentItemAllocation().LocationID.value;
        var enteredBin = this.enteredData.location;
        if (curBin != enteredBin) {
            alert(enteredBin + " is not the recommended bin " + curBin);
            return;
            // TODO: allow location overide
        }

        //document.getElementById("item").focus();
        this.itemInput.setFocus();
    }

    setItem() {
        var curItem = this.getCurrentItem();
        var enteredItem = this.enteredData.item;

        this.cache.getItemById(enteredItem).then((item: any)=> {

            if (item.InventoryID.value != curItem.InventoryID.value) {
                alert("The entered item does not match the requested item.");
                return;
            }

            this.showQty = true;
            this.enteredData.item = item.InventoryID.value;
            //document.getElementById("qty").focus();
            setTimeout(()=> {
                this.qtyInput.setFocus();
            });

        }).catch((err)=> {
            alert(err.message);
        });
    }

    setLotSerial() {

    }

    setQuantity() {

        this.addPick();
    }

    addPick() {

        for (var i in this.enteredData) {
            if (this.enteredData[i] == "") {

                if (i == "lot" && !this.serialTracked)
                    continue;

                alert("Please enter all required fields.");
                return;
            }
        }

        // validate qty
        if (parseInt(this.enteredData.qty) < 1){
            alert("Quantity must be greater than 0.");
            return;
        }

        if (parseInt(this.enteredData.qty) > this.getCurrentItemLeftToPickQty()){
            alert("The entered quantity exceeds the quantity needed for this item.");
            return;
        }

        var item = this.getCurrentItem();
        var itemId = item.InventoryID.value;

        var currentAllocation = this.getCurrentItemAllocation();

        var data = {
            LocationID: {value: this.enteredData.location},
            InventoryID: {value: itemId},
            LotSerialNbr: {value: this.enteredData.lot},
            Qty: {value: parseInt(this.enteredData.qty)},
            itemLineNbr: item.LineNbr.value,
            lineNbr: null
        };

        if (currentAllocation &&
            this.enteredData.location == currentAllocation.LocationID.value &&
            this.enteredData.item == item.InventoryID.value &&
            this.enteredData.lot == currentAllocation.LotSerialNbr.value) {

            data.lineNbr = {value: currentAllocation.lineNumber};
        }

        console.log(JSON.stringify(currentAllocation));
        console.log(JSON.stringify(this.enteredData));

        var itemComplete = this.pickProvider.addPick(this.currentItemIndex, this.currentAllocationIndex, data);

        this.resetForm();

        if (itemComplete){
            this.currentAllocationIndex = 0;

            // TODO: check if all items are complete and prompt to save
        }

    }

    cancelPicks() {

        if (this.pickProvider.pickedItems.length > 0) {

            let alert = this.alertCtrl.create({
                title: "Cancel picks",
                message: "Yo mah dude, are you sure you want to abort these picks ya been doing?",
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

    savePicks() {

    }

}
