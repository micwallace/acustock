import { Component, ViewChild, NgZone } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, Events, AlertController } from 'ionic-angular';
import { TransferProvider } from '../../../providers/transfer/transfer'
import { CacheProvider } from "../../../providers/cache/cache";
import { LoadingController } from "ionic-angular/index";
import { UtilsProvider } from "../../../providers/utils";

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

    private dismissLoader() {
        return this.loader.dismiss();
        //this.loader = null;
    }

    setLocation(locId, isScan) {

        if (locId) {
            this.enteredData.location = locId;
        } else {
            locId = this.enteredData.location;
        }

        this.loader = this.loadingCtrl.create({content: "Loading..."});
        this.loader.present();

        // Validate bin and load current bin contents
        this.cache.getBinById(locId).then((bin)=> {

            this.cache.api.getLocationContents(locId, this.cache.prefs.getPreference('warehouse')).then((itemList:any)=> {

                console.log(JSON.stringify(itemList));
                // Index current items for easier validation
                this.currentLocationItems = {};

                for (let item of itemList) {
                    this.currentLocationItems[item.InventoryID.value] = item;
                }

                //document.getElementById("item").focus();
                this.enteredData.toLocation = "";
                this.showItem = false;
                this.showQty = false;
                this.toLocationInput.setFocus();

                this.dismissLoader();

                if (isScan)
                    this.utils.playScanSuccessSound();

            }).catch((err) => {
                this.enteredData.location = "";
                this.utils.playFailedSound(isScan);
                this.dismissLoader().then(()=> {
                    this.utils.showAlert("Error", err.message, {exception: err});
                });
            });

        }).catch((err) => {
            this.enteredData.location = "";
            this.utils.playFailedSound(isScan);
            this.dismissLoader().then(()=> {
                this.utils.showAlert("Error", err.message, {exception: err});
            });
        });

    }

    setToLocation(locId, isScan) {

        if (this.enteredData.location == locId) {
            this.utils.showAlert("Error", "From and to location must be different");
            return;
        }

        if (locId) {
            this.enteredData.toLocation = locId;
        } else {
            locId = this.enteredData.toLocation;
        }

        this.loader = this.loadingCtrl.create({content: "Loading..."});
        this.loader.present();

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

        this.loader = this.loadingCtrl.create({content: "Loading..."});
        this.loader.present();

        this.cache.getItemById(itemId).then((item:any)=> {

            this.dismissLoader();

            // Check that the item is available
            if (!this.currentLocationItems.hasOwnProperty(item.InventoryID.value)) {
                this.utils.playFailedSound(isScan);
                this.utils.showAlert("Error", "There is no quantity on-hand to transfer for the item and location combination.");
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
        }).catch((err)=> {
            this.dismissLoader();
            this.utils.playFailedSound();
            this.utils.showAlert("Error", err.message, {exception: err});
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
                this.utils.showAlert("Error", err.message);
                this.utils.playFailedSound(true);
            });
        });
    }

}
