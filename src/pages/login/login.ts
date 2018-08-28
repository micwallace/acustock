import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController } from 'ionic-angular';
import { Api } from "../../providers/core/api";
import { CacheProvider } from "../../providers/core/cache";
import { PickShipmentsPage } from "../pick-shipments/pick-shipments";
import { UtilsProvider } from "../../providers/core/utils";
import {SetupPage} from "../setup/setup";

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

        let loader = this.loadingCtrl.create({content: "Logging in..."});
        loader.present();

        this.api.testConnection(this.username, this.password).then(() => {

            loader.dismiss();

            this.navCtrl.setRoot(PickShipmentsPage);

            console.log("Login succeeded, loading initial data...");
            this.cache.initialLoad();

            this.cache.prefs.setPreference("connection_username", this.username);
            // TODO: Optional remember password
            this.cache.prefs.setPreference("connection_password", this.password);

        }).catch((err) => {
            loader.dismiss();
            this.utils.processApiError("Error", "Login failed, please check connection. " + err.message, err);
        });
    }

    goToSetup(){
        this.navCtrl.setRoot(SetupPage);
    }

    onScan() {

    }

}
