import { Component } from '@angular/core';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { IonicPage, NavController, NavParams, LoadingController, AlertController } from 'ionic-angular';
import { ReceiveProvider } from "../../providers/app/receive";
import { ReceiveShipmentPage } from "./shipment/receive-shipment";
import { UtilsProvider } from "../../providers/core/utils";

/**
 * Generated class for the ReceivePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-receive',
    templateUrl: 'receive.html',
})
export class ReceivePage {

    public receiptType = "shipment";
    public referenceNbr = "";

    constructor(public navCtrl:NavController,
                public navParams:NavParams,
                public barcodeScanner:BarcodeScanner,
                public loadingCtrl:LoadingController,
                public receiveProvider:ReceiveProvider,
                public alertCtrl: AlertController,
                public utils:UtilsProvider) {
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad ReceivePage');
    }

    loadReceipt(referenceNbr, isScan=false){

        this.referenceNbr = referenceNbr;

        let loader = this.loadingCtrl.create({content: "Loading..."});
        loader.present();

        this.receiveProvider.loadReceipt(this.referenceNbr, this.receiptType).then((res)=> {

            loader.dismiss();
            this.receiptType = this.receiveProvider.type;

        }).catch((err)=> {

            loader.dismiss();
            this.referenceNbr = "";
            this.utils.playFailedSound(isScan);
            this.utils.processApiError("Error", err.message, err, this.navCtrl);

        });
    }

    startCameraScanner() {
        this.barcodeScanner.scan().then((barcodeData) => {
            if (barcodeData.cancelled)
                return;

            this.onBarcodeScan(barcodeData.text);

        }, (err) => {
            // An error occurred
            this.utils.showAlert("Error", "Error accessing barcode device: " + err, {exception: err});
        });
    }

    onBarcodeScan(barcodeText){
        this.loadReceipt(barcodeText, true);
    }

    addReceipt() {

        if (this.receiveProvider.type == "shipment") {

            if (this.receiveProvider.sourceDocument.Status.value !== "Open"){

                if (this.receiveProvider.sourceDocument.Status.value === "Confirmed"){

                    let dialog = this.alertCtrl.create({
                        title: 'Re-Open Shipment',
                        message: 'This shipment is already confirmed, do you want to correct?',
                        buttons: [
                            {
                                text: 'Cancel',
                                role: 'cancel',
                                handler: () => {}
                            },
                            {
                                text: 'OK',
                                handler: () => {

                                    let loader = this.loadingCtrl.create({content: "Re-opening shipment..."});
                                    loader.present();

                                    this.receiveProvider.correctShipment().then(()=>{
                                        this.receiveProvider.sourceDocument.Status.value = "Open";

                                        loader.dismiss();
                                        //noinspection TypeScriptValidateTypes
                                        this.navCtrl.push(ReceiveShipmentPage);
                                    }).catch((err)=>{
                                        loader.dismiss().then(()=>{
                                            this.utils.processApiError("Error", err.message, err, this.navCtrl);
                                        });
                                    });
                                }
                            }
                        ]
                    });

                    dialog.present();

                } else {

                    this.utils.showAlert("Error", "This receipt shipment is completed and cannot be edited.");
                    return;
                }
                return;
            }

        } else {

            if (this.receiveProvider.type == "transfer" && this.receiveProvider.sourceDocument.Status.value !== "Released"){
                this.utils.showAlert("Error", "Unable to add receipt: the transfer document has not been released.");
                return;
            }

            if (this.receiveProvider.type == "purchase" && this.receiveProvider.sourceDocument.Status.value !== "Open"){
                this.utils.showAlert("Error", "Unable to add receipt: the purchase order status is not open.");
                return;
            }

            if (this.receiveProvider.unreceivedQty == 0) {
                this.utils.showAlert("Error", "There are no items left to receive.");
                return;
            }
        }

        //noinspection TypeScriptValidateTypes
        this.navCtrl.push(ReceiveShipmentPage);
    }

}
