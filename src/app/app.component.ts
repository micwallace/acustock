import { Component, ViewChild } from '@angular/core';
import { Platform, Nav, LoadingController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { AppPreferences } from '@ionic-native/app-preferences';

import { HomePage } from '../pages/home/home';
import { PickShipmentsPage } from '../pages/pick-shipments/pick-shipments';
import { ItemLookupPage } from '../pages/item-lookup/item-lookup';
import { BinLookupPage } from '../pages/bin-lookup/bin-lookup';
import { SetupPage } from '../pages/setup/setup';
import { Api, CacheProvider, PickProvider } from '../providers/providers';

@Component({
    templateUrl: 'app.html'
})
export class MyApp {
    @ViewChild(Nav) navCtrl:Nav;
    rootPage:any = PickShipmentsPage;

    constructor(platform:Platform, statusBar:StatusBar, splashScreen:SplashScreen, public appPreferences:AppPreferences, public api:Api, public cache:CacheProvider, public loadingCtrl: LoadingController) {
        platform.ready().then((readySrc) => {

            console.log('Platform ready from', readySrc);
            // This is to fix ionic live install bug
            // TODO: Remove for production
            //setTimeout(() => {
                // Okay, so the platform is ready and our plugins are available.
                // Here you can do any higher level native things you might need.
                statusBar.styleDefault();
                splashScreen.hide();

                var context = this;

                context.appPreferences.fetch('url').then(function (res) {
                    if (!res) {
                        context.rootPage = SetupPage;
                    } else {
                        let loader = context.loadingCtrl.create({content: "Logging in..."});
                        loader.present();

                        context.api.testConnection().then(() => {

                            loader.dismiss();

                            console.log("Login succeeded, loading initial data...");
                            context.cache.initialLoad().then(() => {
                                console.log("Initial data loaded.")
                            }).catch((err) => {
                                console.log("Initial data load failed: " + err)
                            });

                        }).catch((err) => {
                            loader.dismiss();
                            context.navCtrl.setRoot(SetupPage);
                            console.log(JSON.stringify(err));
                            alert("Login failed, please check connection. " +err.message);
                        });
                    }
                }).catch((err) => {
                    alert("Failed to load the cordova platform. " + err.message);
                });

            //}, 2000);

        }).catch((err) => {

        });
    }

    goToPickShipments(params) {
        if (!params) params = {};
        this.navCtrl.setRoot(PickShipmentsPage);
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
        this.appPreferences.show().catch((err) => {
            //TODO: add setup check here. alert(err);
        });
    }

}
