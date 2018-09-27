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
import { IonicPage, Events, PopoverController, LoadingController, AlertController } from 'ionic-angular';
import { PreferencesProvider, CacheProvider } from '../../providers/providers'
import { UtilsProvider } from "../../providers/core/utils";
import { PreferencesPopover } from "./preferences-popover";
import { Pro } from '@ionic/pro';

@IonicPage()
@Component({
    selector: 'page-preferences',
    templateUrl: 'preferences.html',
})
export class PreferencesPage {

    preferences;
    currentWarehouse = "";

    constructor(public alertCtrl:AlertController,
                public prefs:PreferencesProvider,
                public loadingCtrl:LoadingController,
                public events:Events,
                public cache:CacheProvider,
                public utils:UtilsProvider,
                public popoverCtrl:PopoverController) {

        this.preferences = prefs;
        this.currentWarehouse = prefs.getPreference('warehouse');
        this.loadVersions();
    }

    ionViewWillLeave() {
        this.prefs.savePreferences();

        setTimeout(()=> {
            this.events.publish('preferencesSaved');
        }, 200);
    }

    presentPopover(event) {
        let popover = this.popoverCtrl.create(PreferencesPopover);
        popover.present({ev:event});
    }

    getPreferenceOptions(pref) {

        var options = [];

        if (pref.key == "warehouse") {
            if (this.cache.warehouseList)
                for (let warehouse of this.cache.warehouseList) {
                    if (warehouse.Active.value)
                        options.push({
                            label: warehouse.Description.value,
                            value: warehouse.WarehouseID.value
                        });
                }
        } else if (pref.hasOwnProperty('options')) {
            options = pref.options;
        }

        return options;
    }

    onOptionChange(key){

        switch (key){
            case "warehouse":
                this.cache.generateBinList();
                this.cache.flushItemLocationCache();
                break;
            case "remember_password":
                // ignore for first time setup by checking warehouse
                if (this.preferences.getPreference('warehouse') && this.preferences.getPreference("remember_password") === false) {
                    this.preferences.setPreference("connection_password", "", true);
                }
                break;
            case "connection_password":
                if (this.preferences.getPreference('warehouse') && this.preferences.getPreference("connection_password") !== "") {
                    this.preferences.setPreference("remember_password", true, true);
                }
                break;
        }
    }

    onSelectOptionClick(key, value){
        if (["success_sound", "alert_sound", "prompt_sound"].indexOf(key) > -1){
            UtilsProvider.playSound(value);
        }
    }

    // pro stuff
    availableVersions = [];

    private loadVersions(){
        Pro.deploy.getAvailableVersions().then((versions)=>{
            console.log(JSON.stringify(versions));
            this.availableVersions = versions;
        });
    }

    public checkForUpdate(){
        let loader = this.loadingCtrl.create({content: "Loading..."});
        loader.present();

        Pro.deploy.checkForUpdate().then((update)=>{

            console.log(JSON.stringify(update));
            if (update.available){
                let alert = this.alertCtrl.create({
                    title: "Update Available",
                    message: "An update is available, would you like to apply it now?",
                    buttons: [
                        {
                            text: "No",
                            role: "cancel"
                        },
                        {
                            text: "Yes",
                            handler: ()=> {
                                this.updateApp();
                            }
                        }
                    ]
                });
                alert.present();
            } else {
                this.utils.showAlert("No Update", "There are no updated available.");
            }
        }).catch((err)=>{
            loader.dismiss();
        });
    }

    private updateApp(){
        let loader = this.loadingCtrl.create({content: "Loading 0%"});
        loader.present();

        Pro.deploy.downloadUpdate((progress) => {

            loader.data.content = "Loading " + progress + "%";

        }).then((result)=>{

            console.log(JSON.stringify(result));

            Pro.deploy.extractUpdate((progress) => {

                loader.data.content = "Loading " + progress + "%";

            }).then((result)=>{

                console.log(JSON.stringify(result));
                loader.dismiss().then(()=>{
                    Pro.deploy.reloadApp();
                });
            }).catch((err)=>{
                loader.dismiss();
            });
        }).catch((err)=>{
            loader.dismiss();
        });
    }

    public switchVersion(){

    }

}
