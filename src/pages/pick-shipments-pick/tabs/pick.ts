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

    currentLocationIndex = 0;
    currentItemIndex = 0;

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

    getSuggestedLocation(){
        return this.pickProvider.getSuggestedLocation(this.currentLocationIndex);
    }

    getSuggestedItem(){
        return this.pickProvider.getSuggestedItem(this.currentLocationIndex, this.currentItemIndex)
    }

    getCurrentItemPickedQty() {
        var alloc = this.getSuggestedItem();
        return this.pickProvider.getPendingAllocationQty(alloc.SplitLineNbr.value, alloc.LineNbr.value);
    }

    getSuggestedPickQty(){
        return this.getSuggestedItem().RemainingQty;
    }

    getCurrentItemLeftToPickQty(){
        return this.getSuggestedItem().RemainingQty;
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

        console.log(this.currentLocationIndex+" / "+this.currentItemIndex);
        console.log(this.getSuggestedItem());
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
        var curBin = this.getSuggestedItem().LocationID.value;
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
        var curItem = this.getSuggestedItem();
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

        //this.addPick();
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
        if (this.enteredData.qty < 1){
            alert("Quantity must be greater than 0.");
            return;
        }

        if (this.enteredData.qty > this.getCurrentItemLeftToPickQty()){
            alert("The entered quantity exceeds the quantity needed for this item.");
            return;
        }

        console.log(JSON.stringify(this.enteredData));

        var data = {
            location: this.enteredData.location,
            item: this.enteredData.item,
            lot: this.enteredData.lot,
            qty: parseInt(this.enteredData.qty)
        };

        var itemComplete = this.pickProvider.addPick(data, this.currentLocationIndex, this.currentItemIndex);

        this.resetForm();

        if (itemComplete){
            this.currentItemIndex = 0;

            // TODO: check if all items are complete and prompt to save
        }

    }

    cancelPicks() {

        if (Object.keys(this.pickProvider.pendingPicks).length > 0) {

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
