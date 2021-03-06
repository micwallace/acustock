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

import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController, AlertController } from 'ionic-angular';
import { Api } from "../../providers/core/api";
import { CacheProvider } from "../../providers/core/cache";
import { PickShipmentsPage } from "../pick-shipments/pick-shipments";
import { UtilsProvider } from "../../providers/core/utils";
import { SetupPage } from "../setup/setup";

@IonicPage()
@Component({
    selector: 'page-login',
    templateUrl: 'login.html'
})
export class LoginPage {

    message = null;
    username = "";
    password = "";

    constructor(public navCtrl:NavController,
                public navParams:NavParams,
                public loadingCtrl:LoadingController,
                public alertCtrl:AlertController,
                public cache:CacheProvider,
                public api:Api,
                public utils:UtilsProvider) {

        var message = navParams.get("message");
        if (message)
            this.message = message;

        this.username = cache.prefs.getPreference("connection_username");
        this.password = cache.prefs.getPreference("connection_password");
    }

    login() {

        if (this.username == "" || this.password == ""){
            this.utils.showAlert("Error", "Please enter username and password");
        }

        let loader = this.loadingCtrl.create({content: "Logging in..."});
        loader.present();

        this.api.testConnection(this.username, this.password, this.alertCtrl).then(() => {

            loader.dismiss();

            //noinspection TypeScriptValidateTypes
            this.navCtrl.setRoot(PickShipmentsPage);

            console.log("Login succeeded, loading initial data...");
            this.cache.initialLoad();

            // Password is persisted in api.ts
            this.cache.prefs.setPreference("connection_username", this.username);

        }).catch((err) => {

            loader.dismiss();
            if (err == "version_mismatch")
                return;

            this.utils.processApiError("Error", "Login failed, please check connection. " + err.message, err);
        });
    }

    goToSetup(){
        //noinspection TypeScriptValidateTypes
        this.navCtrl.setRoot(SetupPage);
    }

    onScan() {

    }

}
