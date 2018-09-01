import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController, Events } from 'ionic-angular';
import { PickShipmentsPage } from "../pick-shipments/pick-shipments";
import { Api } from '../../providers/providers';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { PreferencesProvider } from "../../providers/core/preferences";
import { PreferencesPage } from "../preferences/preferences";
import { UtilsProvider } from "../../providers/core/utils";
import { CacheProvider } from "../../providers/core/cache";
import {AlertController} from "ionic-angular/index";

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

    constructor(public navCtrl:NavController,
                public navParams:NavParams,
                public prefs:PreferencesProvider,
                public api:Api,
                public barcodeScanner:BarcodeScanner,
                public loadingCtrl:LoadingController,
                public alertCtrl:AlertController,
                public events:Events,
                public utils:UtilsProvider,
                public cache:CacheProvider) {

    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad SetupPage');
    }

    showPreferences() {
        this.events.subscribe('preferencesSaved', ()=> {
            if (this.prefs.getPreference('url') == "") {
                this.utils.showAlert("Error", "Please configure connection preferences to continue");
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
            this.utils.showAlert("Error", "Error accessing barcode device: " + err);
        });
    }

    onBarcodeScan(barcodeText) {
        this.loadBarcodeConfiguration(barcodeText);
    }

    loadBarcodeConfiguration(barcodeText) {

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

            this.utils.playScanSuccessSound();

            this.testConnection(true);

        } catch (e) {
            this.utils.playFailedSound(true);
            this.utils.showAlert("Error", "Invalid configuration barcode.");
        }
    }

    protected testConnection(isScan=false) {

        this.events.unsubscribe('preferencesSaved');

        let loader = this.loadingCtrl.create({content: "Loading..."});
        loader.present();

        this.api.testConnection(null, null).then((res) => {

            this.cache.getWarehouseList().then((warehouseList:any)=>{

                loader.dismiss();
                this.promptForWarehouse(warehouseList);

            }).catch((err) => {
                loader.dismiss();
                this.utils.playFailedSound(isScan);
                this.utils.processApiError("Error", "Connection failed: " + err.message, err, this.navCtrl);
            });

        }).catch((err) => {
            loader.dismiss();
            this.utils.playFailedSound(isScan);
            this.utils.processApiError("Error", "Connection failed: " + err.message, err, this.navCtrl);
        });
    }

    private promptForWarehouse(warehouseList){

        let alert = this.alertCtrl.create({
            title: "Warehouse",
            message: "Please select Warehouse",
            enableBackdropDismiss: false,
            buttons: [
                {
                    text: "OK",
                    handler: (data)=> {
                        this.prefs.setPreference("warehouse", data);
                        this.promptForDeviceName();
                    }
                }
            ]
        });

        var curWarehouse = this.cache.getCurrentWarehouse();

        for (let warehouse of warehouseList) {
            if (warehouse.Active.value)
                alert.addInput({
                    type: "radio",
                    label: warehouse.Description.value,
                    value: warehouse.WarehouseID.value,
                    checked: (warehouse.WarehouseID.value == curWarehouse.WarehouseID.value)
                });
        }

        alert.present();
    }

    private promptForDeviceName(){
        let alert = this.alertCtrl.create({
            title: "Device Name",
            message: "Please enter device name",
            enableBackdropDismiss: false,
            inputs: [{
                name: 'device',
                placeholder: 'Device Name',
                value: this.prefs.getPreference("device")
            }],
            buttons: [
                {
                    text: "OK",
                    handler: (data)=> {
                        this.prefs.setPreference("device", data.device);
                        this.navCtrl.setRoot(PickShipmentsPage);
                        this.cache.initialLoad();
                    }
                }
            ]
        });

        alert.present();
    }

}
