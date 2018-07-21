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
    selector: 'page-receive',
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

    currentSourceLine = null;

    showLocation = false;
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

        this.currentSourceLine = null;

        this.showLocation = false;
        this.showQty = false;

        this.locationInput.setFocus();
    }

    private dismissLoader() {
        return this.loader.dismiss();
        //this.loader = null;
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

            // validate item against source document
            var line = this.receiveProvider.getSourceLineByInventoryId(item.InventoryID.value);

            if (line == null){
                this.currentSourceLine = null;
                this.enteredData.item = "";
                this.enteredData.qty = 0;
                alert("The item does not exist on the picklist or has already been picked.");
                this.dismissLoader();
                return;
            }

            this.currentSourceLine = line;
            this.showLocation = true;

            if (this.enteredData.location != "") {
                this.showQty = true;
                this.enteredData.qty = 1;
            }

            //TODO: load item warehouse details for default receipt location

            this.dismissLoader();

        }).catch((err) => {
            this.enteredData.item = "";
            this.dismissLoader().then(()=> {
                alert(err.message);
            });
        });
    }

    setLocation(locId) {

        if (locId) {
            this.enteredData.location = locId;
        } else {
            locId = this.enteredData.location;
        }

        this.loader = this.loadingCtrl.create({content: "Loading..."});
        this.loader.present();

        this.cache.getBinById(locId).then((bin)=> {

            if (this.enteredData.item != "") {
                this.showQty = true;
                this.enteredData.qty = 1;
            }

            this.dismissLoader();

        }).catch((err) => {
            this.enteredData.location = "";
            this.dismissLoader().then(()=> {
                alert(err.message);
            });
        });

    }

    getRemainingQty(){
        if (this.currentSourceLine == null)
            return -1;

        return this.receiveProvider.getRemainingQty(this.currentSourceLine.LineNbr);
    }

    validateItemQty(qty:any) {

        if (!qty)
            qty = this.enteredData.qty;

        return (this.getRemainingQty() - qty) >= 0;
    }

    /*nextFromBin() {
        if (this.enteredData.item != "" && this.enteredData.qty > 0) {
            this.addReceiptItem();
        }

        this.resetForm();
    }

    nextItem() {
        if (this.enteredData.item != "" && this.enteredData.qty > 0) {
            this.addReceiptItem();
        }

        this.enteredData.item = "";
        this.enteredData.qty = 0;
        this.showItem = false;
        this.showQty = false;
    }*/

    addReceiptItem() {
        // validate values
        if (!this.validateItemQty(null)) {
            alert("You've entered a qty of "+this.enteredData.qty+" but there is only "+this.getRemainingQty()+" left to receive.");
            return;
        }

        this.receiveProvider.addReceiptItem(this.enteredData, this.currentSourceLine);

        this.resetForm();
    }

    confirmReceipt() {
        //this.nextFromBin();

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

        // If the location and to-location is already set, scanning a bin barcode updates the to-location
        this.cache.getBinById(barcodeText).then((bin)=> {
            // check if quantity is set. If it is then save the current entry
            if (this.enteredData.item != "" && this.enteredData.location != "" && this.enteredData.qty > 0) {
                this.addReceiptItem();
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

                        if (!this.validateItemQty(this.enteredData.qty + 1)){
                            alert("You've already picked the quantity required for this item.");
                            return;
                        }
                        this.enteredData.qty++;

                        // If the completed quantity is reached let's automatically add the receipt item
                        /*if ((this.getRemainingQty() - this.enteredData.qty) <= 0){
                            this.addReceiptItem();
                        }*/
                    });
                } else {
                    this.addReceiptItem();

                    this.setItem(item.InventoryID.value);
                }
            }).catch((err) => {
                alert(err.message);
            });
        });
    }

}
