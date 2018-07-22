import { Component, ViewChild } from '@angular/core';
import { Platform, Nav, LoadingController, ToastController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomePage } from '../pages/home/home';
import { PickShipmentsPage } from '../pages/pick-shipments/pick-shipments';
import { ItemLookupPage } from '../pages/item-lookup/item-lookup';
import { BinLookupPage } from '../pages/bin-lookup/bin-lookup';
import { SetupPage } from '../pages/setup/setup';
import { Api, CacheProvider, PreferencesProvider } from '../providers/providers';
import { PreferencesPage } from "../pages/preferences/preferences";
import { BinTransferPage } from "../pages/bin-transfer/bin-transfer";
import { LoginPage } from "../pages/login/login";
import { ReceivePage } from "../pages/receive/receive";

@Component({
    templateUrl: 'app.html'
})
export class MyApp {
    @ViewChild(Nav) navCtrl:Nav;
    rootPage:any = ReceivePage;

    constructor(platform:Platform, statusBar:StatusBar, splashScreen:SplashScreen, public prefs:PreferencesProvider, public api:Api,
                public cache:CacheProvider, public loadingCtrl:LoadingController, public toastCtrl:ToastController) {

        platform.ready().then((readySrc) => {

            console.log('Platform ready from', readySrc);

            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            statusBar.styleDefault();
            splashScreen.hide();

            var context = this;

            if (!this.prefs.isSetupComplete()) {

                context.navCtrl.setRoot(SetupPage);

            } else if (!this.prefs.hasPreference("connection_password")) {

                context.navCtrl.setRoot(LoginPage);

            } else {

                let loader = context.loadingCtrl.create({content: "Logging in..."});
                loader.present();

                context.api.testConnection(null, null).then(() => {

                    loader.dismiss();

                    console.log("Login succeeded, loading initial data...");
                    context.cache.initialLoad();

                }).catch((err) => {
                    loader.dismiss();
                    context.navCtrl.setRoot(SetupPage);
                    console.log(JSON.stringify(err));
                    alert("Login failed, please check connection. " + err.message);
                });

            }

        }).catch((err) => {

        });
    }

    goToTransfer(params) {
        if (!params) params = {};
        this.navCtrl.setRoot(BinTransferPage);
    }

    goToPickShipments(params) {
        if (!params) params = {};
        this.navCtrl.setRoot(PickShipmentsPage);
    }

    goToReceive(params){
        if (!params) params = {};
        this.navCtrl.setRoot(ReceivePage);
    }

    goToHome(params) {
        if (!params) params = {};
        this.navCtrl.setRoot(HomePage);
    }

    goToItemLookup(params) {
        if (!params) params = {};
        this.navCtrl.setRoot(ItemLookupPage);
    }

    goToBinLookup(params) {
        if (!params) params = {};
        this.navCtrl.setRoot(BinLookupPage);
    }

    showPreferences() {
        /*this.appPreferences.show().catch((err) => {
         //TODO: add setup check here. alert(err);
         });*/
        this.navCtrl.push(PreferencesPage);
    }

}
