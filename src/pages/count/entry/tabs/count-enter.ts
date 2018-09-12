import { Component, ViewChild, NgZone, Renderer } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, Events, AlertController } from 'ionic-angular';
import { CountProvider } from '../../../../providers/app/count'
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
    selector: 'page-count-entry',
    templateUrl: 'count-enter.html'
})
export class CountEntryEnterTab {

    @ViewChild('location') locationInput;
    @ViewChild('item') itemInput;
    @ViewChild('qty') qtyInput;

    enteredData = {
        location: "",
        item: "",
        qty: 0
    };

    currentSourceLine = null;

    showItem = false;
    showQty = false;

    loader;

    constructor(private zone:NgZone,
                public navCtrl:NavController,
                public navParams:NavParams,
                public countProvider:CountProvider,
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

        if (this.countProvider.hasSavedCounts()) {

            let alert = this.alertCtrl.create({
                title: "Load saved counts",
                message: "There are unconfirmed counts available. Do you want to continue from where you left off?",
                buttons: [
                    {
                        text: "No",
                        role: "cancel",
                        handler: ()=> {
                            this.countProvider.clearSavedCounts();
                        }
                    },
                    {
                        text: "Yes",
                        handler: ()=> {
                            this.countProvider.loadSavedCounts();
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

    resetForm() {

        this.enteredData.item = "";
        this.enteredData.qty = 0;

        this.currentSourceLine = null;

        this.showItem = false;
        this.showQty = false;

        this.locationInput.setFocus();
    }

    private dismissLoader() {
        return this.loader.dismiss();
        //this.loader = null;
    }

    setLocation(locId, isScan=false) {

        if (locId) {
            this.enteredData.location = locId;
        } else {
            locId = this.enteredData.location;
        }

        this.loader = this.loadingCtrl.create({content: "Loading..."});
        this.loader.present();

        this.showQty = false;

        this.cache.getBinById(locId).then((bin)=> {

            this.showItem = true;

            if (this.enteredData.item != "") {
                this.showQty = true;
                this.enteredData.qty = 1;
            }

            this.dismissLoader();

            if (isScan)
                this.utils.playScanSuccessSound();

        }).catch((err) => {

            this.enteredData.location = "";
            this.dismissLoader().then(()=> {
                this.utils.showAlert("Error", err.message);
            });

            this.utils.playFailedSound(isScan);
        });

    }

    setItem(itemId, isScan=false) {

        if (itemId) {
            this.enteredData.item = itemId;
        } else {
            itemId = this.enteredData.item;
        }

        this.currentSourceLine = null;

        this.loader = this.loadingCtrl.create({content: "Loading..."});
        this.loader.present();

        this.cache.getItemById(itemId).then((item:any)=> {

            // get count line based on the currently entered data
            var line = this.countProvider.getCountLine(this.enteredData);

            if (line == null){

                this.dismissLoader().then(()=>{
                    let alertDialog = this.alertCtrl.create({
                        title: "Create Count Line",
                        message: "There is no count line which matches the currently entered item/location. Create a new line?",
                        buttons: [
                            {
                                text: "No",
                                role: "cancel"
                            },
                            {
                                text: "Yes",
                                handler: ()=> {

                                    this.loader = this.loadingCtrl.create({content: "Adding line..."});
                                    this.loader.present();

                                    this.countProvider.addNewCountLine(this.enteredData).then((res)=>{

                                        this.currentSourceLine = res;

                                        if (this.enteredData.location != "") {
                                            this.showQty = true;
                                            this.enteredData.qty = 1;
                                        }

                                        this.dismissLoader();

                                        if (isScan)
                                            this.utils.playScanSuccessSound();

                                    }).catch((err)=>{
                                        this.showQty = false;
                                        this.enteredData.item = "";
                                        this.dismissLoader().then(()=>{
                                            this.utils.processApiError("Error", err.message, err, this.navCtrl);
                                        });

                                        this.utils.playFailedSound();
                                    });
                                }
                            }
                        ]
                    });

                    alertDialog.present();

                    this.utils.playPromptSound(isScan);
                });
                return;
            }

            this.currentSourceLine = line;

            if (this.enteredData.location != "") {
                this.showQty = true;
                this.enteredData.qty = 1;
            }

            this.dismissLoader();

            if (isScan)
                this.utils.playScanSuccessSound();

        }).catch((err) => {
            this.showQty = false;
            this.enteredData.item = "";
            this.dismissLoader().then(()=> {
                this.utils.showAlert("Error", err.message);
            });

            this.utils.playFailedSound(isScan);
        });
    }

    getBookQty(){
        if (this.currentSourceLine == null)
            return -1;

        return this.currentSourceLine.BookQuantity.value;
    }

    getPendingQty(){
        if (this.currentSourceLine == null)
            return -1;

        var key = this.currentSourceLine.InventoryID.value + "-" + this.currentSourceLine.LocationID.value;

        return this.countProvider.getPendingQty(key);
    }

    getCountedQty(){
        if (this.currentSourceLine == null)
            return -1;

        var key = this.currentSourceLine.InventoryID.value + "-" + this.currentSourceLine.LocationID.value;

        return this.countProvider.getPendingQty(key);
    }

    nextLocation() {
        if (this.enteredData.item != "" && this.enteredData.qty > 0) {
            this.addCountItem();
        }
    }

    addCountItem() {

        //this.countProvider.addItemCount(this.enteredData, this.currentSourceLine);
        this.countProvider.setCount(this.currentSourceLine, this.enteredData.qty);

        this.resetForm();

        return true;
    }

    commitCounts() {
        if (this.enteredData.item != "" &&  this.enteredData.location != "" && this.enteredData.qty > 0) {
            if (!this.addCountItem())
                return;
        }

        if (this.countProvider.totalPendingQty == 0)
            return this.utils.showAlert("Error", "Add some items to the receipt list first.");

        this.loader = this.loadingCtrl.create({content: "Submitting Counts..."});
        this.loader.present();

        this.countProvider.commitPendingCounts().then(()=>{
            this.dismissLoader();
            //this.events.publish("closeReceiveScreen");
        }).catch((err)=>{
            this.dismissLoader();
            this.utils.processApiError("Error", err.message, err, this.navCtrl, this.countProvider.getErrorReportingData());
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

                        this.enteredData.qty++;

                        this.utils.playScanSuccessSound();
                        // If the completed quantity is reached let's automatically add the receipt item
                        /*if ((this.getRemainingQty() - this.enteredData.qty) <= 0){
                            this.addReceiptItem();
                        }*/
                    });
                } else {
                    this.addCountItem();

                    this.setItem(item.InventoryID.value, true);
                }
            }).catch((err) => {
                this.utils.playFailedSound(true);
                this.utils.showAlert("Error", err.message);
            });
        });
    }

}
