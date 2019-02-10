/*
 * This file is part of AcuStock
 * Copyright (c) 2018 Michael B Wallace
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Component, ViewChild } from '@angular/core';
import { IonicApp, Platform, Nav, LoadingController, AlertController } from 'ionic-angular';
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
import { AdjustmentPage } from "../pages/adjustment/adjustment";
import { AboutPage } from "../pages/about/about";

@Component({
    templateUrl: 'app.html'
})
export class AcuStock {
    @ViewChild(Nav) navCtrl:Nav;
    rootPage:any = LoginPage;

    constructor(public platform:Platform,
                public statusBar:StatusBar,
                public splashScreen:SplashScreen,
                public alertCtrl:AlertController,
                public prefs:PreferencesProvider,
                public api:Api,
                public cache:CacheProvider,
                public loadingCtrl:LoadingController,
                public utils:UtilsProvider,
                private ionicApp: IonicApp) {

        platform.ready().then((readySrc) => {

            console.log('Platform ready from', readySrc);

            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            statusBar.styleDefault();
            splashScreen.hide();

            // Confirm exit
            this.platform.registerBackButtonAction(() => {

                let activeModal = this.ionicApp._modalPortal.getActive();

                if(activeModal){
                    activeModal.dismiss();
                    return;
                } else if (this.navCtrl.length() == 1) {
                    if (!this.showedAlert) {
                        this.confirmExitApp();
                    } else {
                        this.showedAlert = false;
                        this.confirmAlert.dismiss();
                    }
                    return;
                }

                this.navCtrl.pop();
            });

            var context = this;

            if (!this.prefs.isSetupComplete()) {

                context.navCtrl.setRoot(SetupPage);

            } else if (!this.prefs.hasPreference("connection_password")) {

                context.navCtrl.setRoot(LoginPage);

            } else {

                let loader = context.loadingCtrl.create({content: "Logging in..."});
                loader.present();

                context.api.testConnection(null, null, context.alertCtrl).then(() => {

                    loader.dismiss();
                    context.navCtrl.setRoot(PickShipmentsPage);
                    context.cache.initialLoad();
                    console.log("Login succeeded, loading initial data...");

                }).catch((err) => {

                    loader.dismiss();
                    context.navCtrl.setRoot(SetupPage);

                    if (err == "version_mismatch")
                        return;

                    this.utils.processApiError("Error", "Connection failed: "+err.message, err, this.navCtrl);
                });

            }

        }).catch((err) => {

        });
    }

    showedAlert = false;
    confirmAlert = null;

    confirmExitApp() {

        this.showedAlert = true;

        this.confirmAlert = this.alertCtrl.create({
            title: "Exit",
            message: "Are you sure you want to exit AcuStock?",
            buttons: [
                {
                    text: 'Cancel',
                    handler: () => {
                        this.showedAlert = false;
                        return;
                    }
                },
                {
                    text: 'Exit',
                    handler: () => {
                        this.platform.exitApp();
                    }
                }
            ]
        });

        this.confirmAlert.present();
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

    goToAdjustment(params) {
        if (!params) params = {};
        this.navCtrl.setRoot(AdjustmentPage);
    }

    showPreferences() {
        this.navCtrl.push(PreferencesPage);
    }

    showAbout() {
        this.navCtrl.push(AboutPage);
    }

}
