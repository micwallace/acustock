import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';

@Component({
    selector: 'page-pick-shipments',
    templateUrl: 'pick-shipments.html'
})
export class PickShipmentsPage {

    constructor(public navCtrl:NavController, private barcodeScanner:BarcodeScanner) {

    }

    scanShipment() {
        this.barcodeScanner.scan().then((barcodeData) => {
            // Success! Barcode data is here
            alert(barcodeData);
        }, (err) => {
            // An error occurred
            alert("Error accessing barcode device: " + err);
        });
    }

}
