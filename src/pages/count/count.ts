import { Component } from '@angular/core';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { IonicPage, NavController, NavParams, LoadingController } from 'ionic-angular';
import { CountProvider } from "../../providers/count/count";
import { CountEntryPage } from "./entry/count-entry";
import { AlertController } from "ionic-angular/index";
import { Events } from "ionic-angular/index";
import { UtilsProvider } from "../../providers/utils";

/**
 * Generated class for the ReceivePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-count',
    templateUrl: 'count.html',
})
export class CountPage {

    public referenceNbr = "";

    constructor(public navCtrl:NavController,
                public navParams:NavParams,
                public barcodeScanner:BarcodeScanner,
                public loadingCtrl:LoadingController,
                public countProvider:CountProvider,
                public alertCtrl: AlertController,
                public utils:UtilsProvider) {
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad ReceivePage');
    }

    loadCount(referenceNbr, isScan=false){

        this.referenceNbr = referenceNbr;

        let loader = this.loadingCtrl.create({content: "Loading..."});
        loader.present();

        this.countProvider.loadCount(this.referenceNbr).then((res)=> {

            // TODO: check warehouse

            loader.dismiss();

        }).catch((err)=> {

            loader.dismiss();
            this.referenceNbr = "";
            this.utils.playFailedSound(isScan);
            this.utils.showAlert("Error", err.message, err);
        });
    }

    startCameraScanner() {
        this.barcodeScanner.scan().then((barcodeData) => {
            if (barcodeData.cancelled)
                return;

            this.onBarcodeScan(barcodeData.text);

        }, (err) => {
            // An error occurred
            this.utils.showAlert("Error", "Error accessing barcode device: " + err);
        });
    }

    onBarcodeScan(barcodeText){
        this.loadCount(barcodeText, true);
    }

    startCounting() {

        //noinspection TypeScriptValidateTypes
        this.navCtrl.push(CountEntryPage);
    }

}
