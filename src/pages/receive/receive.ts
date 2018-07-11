import { Component } from '@angular/core';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import {ReceiveProvider} from "../../providers/receive/receive";

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

    constructor(public navCtrl:NavController, public navParams:NavParams, public barcodeScanner:BarcodeScanner, public receiveProvider:ReceiveProvider) {
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad ReceivePage');
    }

    scanReceipt() {
        this.barcodeScanner.scan().then((barcodeData) => {
            if (barcodeData.cancelled)
                return;

            this.onBarcodeScan(barcodeData.text);

        }, (err) => {
            // An error occurred
            alert("Error accessing barcode device: " + err);
        });
    }

    onBarcodeScan(barcodeText){

    }

}
