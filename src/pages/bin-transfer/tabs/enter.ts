import { Component, ViewChild, NgZone } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, Events, AlertController } from 'ionic-angular';
import { TransferProvider } from '../../../providers/transfer/transfer'
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

    loader;

    constructor(private zone: NgZone,
                public navCtrl:NavController,
                public navParams:NavParams,
                public transferProvider: TransferProvider,
                public cache:CacheProvider,
                public viewCtrl:ViewController,
                public events:Events,
                public alertCtrl:AlertController,
                public loadingCtrl:LoadingController) {

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

    private dismissLoader(){
        return this.loader.dismiss();
        //this.loader = null;
    }

    setLocation(locId) {

        if (locId){
            this.enteredData.location = locId;
        } else {
            locId = this.enteredData.location;
        }

        this.loader = this.loadingCtrl.create({content: "Loading..."});
        this.loader.present();

        // Validate bin and load current bin contents
        this.cache.getBinById(locId).then((bin)=>{

            this.cache.api.getLocationContents(locId, this.cache.prefs.getPreference('warehouse')).then((itemList:any)=>{

                // Index current items for easier validation
                this.currentLocationItems = {};

                for (let item of itemList){
                    this.currentLocationItems[item.InventoryID.value] = item;
                }

                //document.getElementById("item").focus();
                this.enteredData.toLocation = "";
                this.showItem = false;
                this.showQty = false;
                this.toLocationInput.setFocus();

                this.dismissLoader();

            }).catch((err) => {
                this.enteredData.location = "";
                this.dismissLoader().then(()=>{
                    alert(err.message);
                });
            });

        }).catch((err) => {
            this.enteredData.location = "";
            this.dismissLoader().then(()=>{
                alert(err.message);
            });
        });

    }

    setToLocation(locId) {

        if (this.enteredData.location == locId){
            alert("From and to location must be different");
            return;
        }

        if (locId){
            this.enteredData.toLocation = locId;
        } else {
            locId = this.enteredData.toLocation;
        }

        this.loader = this.loadingCtrl.create({content: "Loading..."});
        this.loader.present();

        this.cache.getBinById(locId).then((bin)=>{

            this.enteredData.item = "";
            this.showItem = true;
            this.showQty = false;
            setTimeout(()=> {
                this.itemInput.setFocus();
            });

            this.dismissLoader();

        }).catch((err) => {
            this.enteredData.toLocation = "";
            this.dismissLoader().then(()=>{
                alert(err.message);
            });
        });
    }

    setItem(itemId){

        if (itemId){
            this.enteredData.item = itemId;
        } else {
            itemId = this.enteredData.item;
        }

        this.loader = this.loadingCtrl.create({content: "Loading..."});
        this.loader.present();

        this.cache.getItemById(itemId).then((item)=>{

            this.dismissLoader();

            // Check that the item is available
            if (!this.currentLocationItems.hasOwnProperty(item.InventoryID.value)){
                alert("There is no quantity on-hand to transfer for the item and location combination.");
                this.enteredData.item = "";
                return;
            }

            this.enteredData.item = item.InventoryID.value; // change alternate IDs like barcodes to primary ID
            this.enteredData.qty = 1;
            this.showQty = true;
            setTimeout(()=> {
                this.qtyInput.setFocus();
            });

        }).catch((err) => {
            this.enteredData.item = "";
            this.dismissLoader().then(()=>{
                alert(err.message);
            });
        });
    }

    nextFromBin(){
        if (this.enteredData.item != "" && this.enteredData.qty > 0){
            this.addTransferItem();
        }

        this.resetForm();
    }

    addTransferItem(){
        // validate values

        this.transferProvider.addPendingItem(this.enteredData.location, this.enteredData.toLocation, this.enteredData.item, this.enteredData.qty);


    }

    onBarcodeScan(barcodeText){
        console.log(barcodeText);

        if (this.enteredData.location == ""){
            this.setLocation(barcodeText);
            return;
        }

        if (this.enteredData.toLocation == ""){
            this.setToLocation(barcodeText);
            return;
        }

        // If the location and to-location is already set, scanning a bin barcode updates the to-location
        this.cache.getBinById(barcodeText).then((bin)=>{
            // check if quantity is set. If it is then save the current entry
            if (this.enteredData.item != "" && this.enteredData.qty > 0){
                this.addTransferItem();
            }

            this.setToLocation(barcodeText);
        }).catch((err) => {

            this.cache.getItemById(barcodeText).then((item)=>{

                if (this.enteredData.item == "" || this.enteredData.qty == 0){
                    this.setItem(item.InventoryID.value);
                    return;
                }

                // If the item is the same as the last item, increment quantity.
                if (item.InventoryID.value == this.enteredData.item){
                    this.zone.run(()=>{
                        this.enteredData.qty++;
                    });
                } else {
                    this.addTransferItem();

                    this.setItem(item.InventoryID.value);
                }
            }).catch((err) => {
                alert(err.message);
            });
        });
    }

}
