import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform, LoadingController } from 'ionic-angular';
import { Subscription } from 'rxjs';

import { AppPreferences } from '@ionic-native/app-preferences';
import { PickShipmentsPage } from "../pick-shipments/pick-shipments";
import { Api } from '../../providers/providers';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';

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
    private onResumeSubscription:Subscription;

    constructor(public navCtrl:NavController, public navParams:NavParams, public platform:Platform, public appPreferences:AppPreferences, public api:Api, public barcodeScanner:BarcodeScanner, public loadingCtrl:LoadingController) {

    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad SetupPage');
    }

    showPreferences() {
        this.onResumeSubscription = this.platform.resume.subscribe(() => {
            this.appPreferences.fetch('url').then((url) => {
                console.log(url);
                if (url == "") {
                    alert("Please configure connection preferences to continue");
                    return;
                }

                this.testConnection();
            });
        });

        this.appPreferences.show().catch((err) => {
            alert(err);
        });
    }

    public scanBarcode() {
        this.barcodeScanner.scan().then((barcodeData) => {
            // Success! Barcode data is here
            if (barcodeData.cancelled)
                return;

            var values = JSON.parse(barcodeData.text);

            if (values)
                for (var i in values) {
                    this.appPreferences.store(i, values[i]);
                }

            this.testConnection();
        }, (err) => {
            // An error occurred
            alert("Error accessing barcode device: " + err);
        });
    }

    private testConnection() {

        if (this.onResumeSubscription)
            this.onResumeSubscription.unsubscribe();

        let loader = this.loadingCtrl.create({content: "Loading..."});
        loader.present();

        this.api.testConnection().then((res) => {

            loader.dismiss();

            if (res === true) {
                this.navCtrl.setRoot(PickShipmentsPage);
            } else {
                alert("Connection failed: " + res);
            }

        });
    }

}
