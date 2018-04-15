import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController, Events } from 'ionic-angular';

import { PickShipmentsPage } from "../pick-shipments/pick-shipments";
import { Api } from '../../providers/providers';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { PreferencesProvider } from "../../providers/preferences/preferences";
import { PreferencesPage } from "../preferences/preferences";

/**
 * Generated class for the SetupPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-setup',
    templateUrl: 'setup.html',
})
export class SetupPage {

    constructor(public navCtrl:NavController, public navParams:NavParams, public prefs:PreferencesProvider, public api:Api, public barcodeScanner:BarcodeScanner, public loadingCtrl:LoadingController, public events:Events) {

    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad SetupPage');
    }

    showPreferences() {
        this.events.subscribe('preferencesSaved', ()=>{
            if (this.prefs.getPreference('url') == "") {
                alert("Please configure connection preferences to continue");
                return;
            }

            this.testConnection();
        });

        this.navCtrl.push(PreferencesPage);
    }

    public scanBarcode() {
        this.barcodeScanner.scan().then((barcodeData) => {
            // Success! Barcode data is here
            if (barcodeData.cancelled)
                return;

            this.loadBarcodeConfiguration(barcodeData.text);

        }, (err) => {
            // An error occurred
            alert("Error accessing barcode device: " + err);
        });
    }

    onBarcodeScan(barcodeText){
        this.loadBarcodeConfiguration(barcodeText);
    }

    loadBarcodeConfiguration(barcodeText){

        try {
            var values = JSON.parse(barcodeText);

            if (values) {
                for (var i in values) {
                    if (this.prefs.defaults.hasOwnProperty("connection_" + i)) {
                        this.prefs.setPreference("connection_" + i, values[i]);
                    } else if (this.prefs.defaults.hasOwnProperty(i)) {
                        this.prefs.setPreference(i, values[i]);
                    }
                }
                this.prefs.savePreferences();
            }

            this.testConnection();

        } catch (e){
            alert("Invalid configuration barcode.");
        }
    }

    private testConnection() {

        this.events.unsubscribe('preferencesSaved');

        let loader = this.loadingCtrl.create({content: "Loading..."});
        loader.present();

        this.api.testConnection().then((res) => {

            loader.dismiss();
            this.navCtrl.setRoot(PickShipmentsPage);

        }).catch((err) => {

            loader.dismiss();
            alert("Connection failed: " + err.message);
        });
    }

}
