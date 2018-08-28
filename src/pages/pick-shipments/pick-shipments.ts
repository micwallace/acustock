import { Component } from '@angular/core';
import { NavController, ModalController, LoadingController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { PickProvider } from '../../providers/app/pick';
import { PickShipmentsListPage } from "./list/pick-shipments-list";
import { PickShipmentsPickPage } from "./pick/pick-shipments-pick";
import { UtilsProvider } from "../../providers/core/utils";

@Component({
    selector: 'page-pick-shipments',
    templateUrl: 'pick-shipments.html'
})
export class PickShipmentsPage {

    shipmentNbr = "";

    constructor(public navCtrl:NavController,
                private barcodeScanner:BarcodeScanner,
                public pickProvider:PickProvider,
                public modalCtrl:ModalController,
                public loadingCtrl:LoadingController,
                public utils:UtilsProvider) {

    }

    onBarcodeScan(barcodeData){
        this.loadShipment(barcodeData, true);
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

    loadShipment(shipmentNbr, isScan=false) {
        this.shipmentNbr = shipmentNbr;

        let loader = this.loadingCtrl.create({content: "Loading..."});
        loader.present();

        this.pickProvider.loadShipment(shipmentNbr).then((res)=> {
            loader.dismiss();
        }).catch((err)=> {
            loader.dismiss();
            this.shipmentNbr = "";
            this.utils.playFailedSound(isScan);
            this.utils.processApiError("Error", err.message, err, this.navCtrl);
        });
    }

    openItemsDialog() {
        console.log(JSON.stringify(this.pickProvider.currentShipment.Details));

        let modal = this.modalCtrl.create(PickShipmentsListPage);
        modal.present();
    }

    openPickDialog() {
        if (this.pickProvider.unpickedQty == 0) {
            this.utils.showAlert("Error", "There are no items left to pick.");
            return;
        }

        //noinspection TypeScriptValidateTypes
        this.navCtrl.push(PickShipmentsPickPage);
    }

}
