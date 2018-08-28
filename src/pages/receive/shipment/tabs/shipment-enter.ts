import { Component, ViewChild, NgZone, Renderer } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, Events, AlertController } from 'ionic-angular';
import { ReceiveProvider } from '../../../../providers/app/receive'
import { CacheProvider } from "../../../../providers/core/cache";
import { LoadingController } from "ionic-angular/index";
import { UtilsProvider } from "../../../../providers/core/utils";

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
                public loadingCtrl:LoadingController,
                public renderer:Renderer,
                public utils:UtilsProvider) {

    }

    ionViewDidLoad() {
        this.events.subscribe('barcode:scan', (barcodeText)=>{
            this.onBarcodeScan(barcodeText)
        });

        if (this.receiveProvider.hasSavedReceipts()) {

            this.utils.playPromptSound();

            let alert = this.alertCtrl.create({
                title: "Load saved receipts",
                message: "There are unconfirmed receipts available. Do you want to continue from where you left off?",
                buttons: [
                    {
                        text: "No",
                        role: "cancel",
                        handler: ()=> {
                            this.receiveProvider.clearSavedReceipts();
                        }
                    },
                    {
                        text: "Yes",
                        handler: ()=> {
                            this.receiveProvider.loadSavedReceipts();
                        }
                    }
                ]
            });

            alert.present();
        }
    }

    ionViewWillUnload(){
        this.events.unsubscribe('barcode:scan');
    }

    resetForm(clearLocation=false) {

        this.enteredData.item = "";
        this.enteredData.qty = 0;

        this.currentSourceLine = null;

        this.showLocation = false;
        this.showQty = false;

        this.locationInput.setFocus();
    }

    private dismissLoader() {
        return new Promise((resolve, reject)=>{

            if (this.loader == null)
                return resolve();

            this.loader.dismiss().then(()=>{
                this.loader = null;
                resolve();
            }).catch((err)=>{
                reject(err);
            });
        });
    }

    setItem(itemId, isScan=false) {

        if (itemId) {
            this.enteredData.item = itemId;
        } else {
            itemId = this.enteredData.item;
        }

        if (this.loader == null) {
            this.loader = this.loadingCtrl.create({content: "Loading..."});
            this.loader.present();
        }

        this.cache.getItemById(itemId).then((item:any)=> {

            // validate item against source document
            var line = this.receiveProvider.getSourceLineByInventoryId(item.InventoryID.value);

            if (line == null){
                this.currentSourceLine = null;
                this.enteredData.item = "";
                this.enteredData.qty = 0;
                this.utils.playFailedSound(isScan);
                this.dismissLoader().then(()=>{
                    this.utils.showAlert("Error", "The item does not exist on this transfer/shipment or has already been received on another receipt.");
                });
                return;
            }

            this.currentSourceLine = line;
            this.showLocation = true;

            if (this.enteredData.location != "") {
                this.showQty = true;
                this.enteredData.qty = 1;
            }

            if (isScan)
                this.utils.playScanSuccessSound();

            // Set default location
            if (line.hasOwnProperty("LocationID")){
                this.setLocation(line.LocationID);
                return;
            } else {
                var warehouseDetails = this.cache.getItemWarehouseDetails(item);
                if (warehouseDetails && warehouseDetails.hasOwnProperty("DefaultReceiptLocationID")){
                    this.setLocation(warehouseDetails.DefaultReceiptLocationID.value);
                    return;
                } else {
                    var warehouse = this.cache.getCurrentWarehouse();
                    if (warehouse && warehouse.hasOwnProperty("ReceivingLocationID")){
                        this.setLocation(warehouse.ReceivingLocationID.value);
                        return;
                    }
                }
            }

            this.dismissLoader();

        }).catch((err) => {
            this.enteredData.item = "";
            this.utils.playFailedSound(isScan);
            this.dismissLoader().then(()=> {
                this.utils.showAlert("Error", err.message, {exception: err});
            }).catch((err)=>{
                this.utils.showAlert("Error", err.message, {exception: err});
            });
        });
    }

    setLocation(locId, isScan=false) {

        if (locId) {
            this.enteredData.location = locId;
        } else {
            locId = this.enteredData.location;
        }

        if (this.loader == null) {
            this.loader = this.loadingCtrl.create({content: "Loading..."});
            this.loader.present();
        }

        this.cache.getBinById(locId).then((bin)=> {

            if (this.enteredData.item != "") {
                this.showQty = true;
                this.enteredData.qty = 1;
            }

            if (isScan) this.utils.playScanSuccessSound();

            this.dismissLoader();

        }).catch((err) => {
            this.enteredData.location = "";
            this.utils.playFailedSound(isScan);
            this.dismissLoader().then(()=> {
                this.utils.showAlert("Error", err.message, {exception: err});
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
    }

    nextItem() {
        if (this.enteredData.item != "" && this.enteredData.qty > 0) {
            this.addReceiptItem();
        }
    }*/

    addReceiptItem(isScan=false) {
        // validate values
        if (!this.validateItemQty(null)) {
            this.utils.playFailedSound(isScan);
            this.utils.showAlert("Error", "You've entered a qty of "+this.enteredData.qty+" but there is only "+this.getRemainingQty()+" left to receive.");
            return false;
        }

        this.receiveProvider.addReceiptItem(this.enteredData, this.currentSourceLine);

        this.resetForm();

        if ((this.receiveProvider.unreceivedQty - this.receiveProvider.pendingQty) <= 0) {

            let alert = this.alertCtrl.create({
                title: "Receipt Complete",
                message: "All items for the current transfer or shipment have been received, would you like to confirm?",
                buttons: [
                    {
                        text: "Cancel",
                        role: "cancel"
                    },
                    {
                        text: "OK",
                        handler: ()=> {
                            alert.dismiss();
                            this.confirmReceipts();
                        }
                    }
                ]
            });

            alert.present();
        }

        return true;
    }

    confirmReceipts() {
        if (this.enteredData.item != "" &&  this.enteredData.location != "" && this.enteredData.qty > 0) {
            if (!this.addReceiptItem())
                return;
        }

        if (this.receiveProvider.pendingQty == 0)
            return this.utils.showAlert("Error", "Add some items to the receipt list first.");

        this.loader = this.loadingCtrl.create({content: "Submitting Receipts..."});
        this.loader.present();

        this.receiveProvider.confirmReceipts(this.loader).then(()=>{
            this.dismissLoader();
            this.events.publish("closeReceiveScreen");
        }).catch((err)=>{
            this.dismissLoader();
            this.utils.playFailedSound(false);
            this.utils.processApiError("Error", err.message, {exception: err}, this.navCtrl);
        });
    }

    onBarcodeScan(barcodeText) {
        console.log(barcodeText);

        // If the location and to-location is already set, scanning a bin barcode updates the to-location
        this.cache.getBinById(barcodeText).then((bin)=> {

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

                        if (!this.validateItemQty(this.enteredData.qty + 1)){
                            this.utils.playFailedSound(true);
                            this.utils.showAlert("Error", "You've already picked the quantity required for this item.");
                            return;
                        }
                        this.enteredData.qty++;

                        this.utils.playScanSuccessSound();

                        // If the completed quantity is reached let's automatically add the receipt item
                        if ((this.getRemainingQty() - this.enteredData.qty) <= 0){
                            this.addReceiptItem(true);
                        }
                    });
                } else {
                    if (this.addReceiptItem(true))
                        this.setItem(item.InventoryID.value, true);

                }
            }).catch((err) => {
                this.utils.showAlert("Error", err.message);
            });
        });
    }

}
