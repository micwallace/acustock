import { Component, ViewChild, NgZone } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, Events, AlertController } from 'ionic-angular';
import { ReceiveProvider } from '../../../../providers/receive/receive'
import { CacheProvider } from "../../../../providers/cache/cache";
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
    templateUrl: 'shipment-enter.html'
})
export class ReceiveShipmentEnterTab {

    @ViewChild('location') locationInput;
    @ViewChild('item') itemInput;
    @ViewChild('qty') qtyInput;

    enteredData = {
        location: "",
        item: "",
        qty: 0
    };

    showItem = false;
    showQty = false;

    loader;

    constructor(private zone:NgZone,
                public navCtrl:NavController,
                public navParams:NavParams,
                public receiveProvider:ReceiveProvider,
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
            item: "",
            qty: 0
        };

        this.showItem = false;
        this.showQty = false;

        this.locationInput.setFocus();
    }

    private dismissLoader() {
        return this.loader.dismiss();
        //this.loader = null;
    }

    setLocation(locId) {

        if (locId) {
            this.enteredData.location = locId;
        } else {
            locId = this.enteredData.location;
        }

        this.loader = this.loadingCtrl.create({content: "Loading..."});
        this.loader.present();

        // Validate bin and load current bin contents
        this.cache.getBinById(locId).then((bin)=> {

        }).catch((err) => {
            this.enteredData.location = "";
            this.dismissLoader().then(()=> {
                alert(err.message);
            });
        });

    }

    setItem(itemId) {

        if (itemId) {
            this.enteredData.item = itemId;
        } else {
            itemId = this.enteredData.item;
        }

        this.loader = this.loadingCtrl.create({content: "Loading..."});
        this.loader.present();

        this.cache.getItemById(itemId).then((item:any)=> {

            this.dismissLoader();


        }).catch((err) => {
            this.enteredData.item = "";
            this.dismissLoader().then(()=> {
                alert(err.message);
            });
        });
    }

    validateItemQty(qty:any) {
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


    }

    commitTransfers() {
        this.nextFromBin();

        /*if (this.receiveProvider.pendingQty == 0)
         return alert("Add some items to the transfer list first.");

         this.loader = this.loadingCtrl.create({content: "Submitting Transfers..."});
         this.loader.present();

         this.receiveProvider.commitReceipt(this.loader).then(()=>{
         this.dismissLoader();
         }).catch((err)=>{
         this.dismissLoader();
         alert(err.message);
         });*/
    }

    onBarcodeScan(barcodeText) {
        console.log(barcodeText);

        if (this.enteredData.location == "") {
            this.setLocation(barcodeText);
            return;
        }

        // If the location and to-location is already set, scanning a bin barcode updates the to-location
        this.cache.getBinById(barcodeText).then((bin)=> {
            // check if quantity is set. If it is then save the current entry
            if (this.enteredData.item != "" && this.enteredData.qty > 0) {
                this.addTransferItem();
            }

            this.setLocation(barcodeText);
        }).catch((err) => {

            this.cache.getItemById(barcodeText).then((item:any)=> {

                if (this.enteredData.item == "" || this.enteredData.qty == 0) {
                    this.setItem(item.InventoryID.value);
                    return;
                }

                // If the item is the same as the last item, increment quantity.
                if (item.InventoryID.value == this.enteredData.item) {
                    this.zone.run(()=> {
                        this.enteredData.qty++;
                        this.validateItemQty(null);
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
