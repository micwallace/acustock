import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { NavParams } from "ionic-angular/index";
import { LoadingController } from "ionic-angular/index";
import { Api, CacheProvider } from "../../providers/providers";
import { PickShipmentsPage } from "../pick-shipments/pick-shipments";
import { UtilsProvider } from "../../providers/utils";

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

        }).catch((err) => {
            // TODO: Open settings page if the error is something other than 401
            loader.dismiss();
            console.log(JSON.stringify(err));
            this.utils.showAlert("Error", "Login failed, please check connection. " + err.message);
        });
    }

    onScan() {

    }

    onCameraScan() {

    }

}
