import { Component } from '@angular/core';
import { NavController, ModalController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { PickProvider } from '../../providers/providers';
import { PickShipmentsListPage } from "../pick-shipments-list/pick-shipments-list";
import { PickShipmentsPickPage } from "../pick-shipments-pick/pick-shipments-pick";
import {LoadingController} from "ionic-angular/index";

@Component({
    selector: 'page-pick-shipments',
    templateUrl: 'pick-shipments.html'
})
export class PickShipmentsPage {

    shipmentNbr = "";

    constructor(public navCtrl:NavController, private barcodeScanner:BarcodeScanner, public pickProvider:PickProvider, public modalCtrl:ModalController, public loadingCtrl:LoadingController) {

    }

    onBarcodeScan(barcodeData){
        this.loadShipment(barcodeData);
    }

    startCameraScanner() {
        this.barcodeScanner.scan().then((barcodeData) => {
            if (barcodeData.cancelled)
                return;

            this.onBarcodeScan(barcodeData.text);

        }, (err) => {
            // An error occurred
            alert("Error accessing barcode device: " + err);
        });
    }

    loadShipment(shipmentNbr) {
        this.shipmentNbr = shipmentNbr;

        let loader = this.loadingCtrl.create({content: "Loading..."});
        loader.present();

        this.pickProvider.loadShipment(shipmentNbr).then((res)=> {
            loader.dismiss();
        }).catch((err)=> {
            loader.dismiss();
            this.shipmentNbr = "";
            alert(err.message);
        });
    }

    openItemsDialog() {
        console.log(JSON.stringify(this.pickProvider.currentShipment.Details));

        let modal = this.modalCtrl.create(PickShipmentsListPage);
        modal.present();
    }

    openPickDialog() {
        if (this.pickProvider.unpickedQty == 0) {
            alert("There are no items left to pick.");
            return;
        }

        //noinspection TypeScriptValidateTypes
        this.navCtrl.push(PickShipmentsPickPage);
    }

}
