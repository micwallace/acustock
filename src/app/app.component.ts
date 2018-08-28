import { Component, ViewChild } from '@angular/core';
import { Platform, Nav, LoadingController, ToastController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { CountPage } from '../pages/count/count';
import { PickShipmentsPage } from '../pages/pick-shipments/pick-shipments';
import { ItemLookupPage } from '../pages/item-lookup/item-lookup';
import { BinLookupPage } from '../pages/bin-lookup/bin-lookup';
import { SetupPage } from '../pages/setup/setup';
import { Api, CacheProvider, PreferencesProvider } from '../providers/providers';
import { PreferencesPage } from "../pages/preferences/preferences";
import { BinTransferPage } from "../pages/bin-transfer/bin-transfer";
import { ReceivePage } from "../pages/receive/receive";
import { UtilsProvider } from "../providers/core/utils";
import { LoginPage } from "../pages/login/login";

@Component({
    templateUrl: 'app.html'
})
export class MyApp {
    @ViewChild(Nav) navCtrl:Nav;
    rootPage:any = LoginPage;

    constructor(public platform:Platform,
                public statusBar:StatusBar,
                public splashScreen:SplashScreen,
                public prefs:PreferencesProvider,
                public api:Api,
                public cache:CacheProvider,
                public loadingCtrl:LoadingController,
                public utils:UtilsProvider) {

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
                    context.navCtrl.setRoot(PickShipmentsPage);
                    context.cache.initialLoad();
                    console.log("Login succeeded, loading initial data...");

                }).catch((err) => {
                    loader.dismiss();
                    context.navCtrl.setRoot(SetupPage);
                    this.utils.processApiError("Error", "Connection failed: "+err.message, err);
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

    goToCount(params) {
        if (!params) params = {};
        this.navCtrl.setRoot(CountPage);
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
        this.navCtrl.push(PreferencesPage);
    }

}
