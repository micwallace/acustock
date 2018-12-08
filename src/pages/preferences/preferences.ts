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
        this.loadCurrentChannel();
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
            // TODO: Detect change of URL or company and retest connection.
        }
    }

    onSelectOptionClick(key, value){
        if (["success_sound", "alert_sound", "prompt_sound"].indexOf(key) > -1){
            UtilsProvider.playSound(value);
        }
    }

    // pro stuff
    public checkForUpdate(){

        let loader = this.loadingCtrl.create({content: "Loading..."});
        loader.present();

        //noinspection TypeScriptUnresolvedVariable
        Pro.deploy.checkForUpdate().then((update)=>{

            //console.log(JSON.stringify(update));
            loader.dismiss().then(()=> {

                if (update && update.available) {

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
                    this.utils.showAlert("No Update", "There are no updates available.");
                }
            });

        }).catch((err)=>{
            loader.dismiss().then(()=> {
                this.utils.showAlert("Update Error", "Could not check for updates: "+err);
            });
        });
    }

    private updateApp(){

        let loader = this.loadingCtrl.create({content: "Loading 0%"});
        loader.present();

        //noinspection TypeScriptUnresolvedVariable
        Pro.deploy.downloadUpdate((progress) => {

            loader.data.content = "Loading " + progress + "%";

        }).then((result)=>{

            console.log(JSON.stringify(result));

            //noinspection TypeScriptUnresolvedVariable
            Pro.deploy.extractUpdate((progress) => {

                loader.data.content = "Loading " + progress + "%";

            }).then((result)=>{

                console.log(JSON.stringify(result));
                loader.dismiss().then(()=>{
                    //noinspection TypeScriptUnresolvedVariable
                    Pro.deploy.reloadApp();
                });
            }).catch((err)=>{
                loader.dismiss().then(()=> {
                    this.utils.showAlert("Update Error", "Failed to extract update: "+err);
                });
            });
        }).catch((err)=>{
            loader.dismiss().then(()=> {
                this.utils.showAlert("Update Error", "Failed to download update: "+err);
            });
        });
    }

    channelLoaded = false;
    updateChannel = "Production";

    public loadCurrentChannel(){
        //noinspection TypeScriptUnresolvedVariable
        Pro.deploy.getConfiguration().then((config)=>{
            this.updateChannel = config.channel;
            this.channelLoaded = true;
        }).catch((err)=>{
            // Silently fail
        });
    }

    public setUpdateChannel(){
        // Workaround for ion-change firing on current channel load
        if (!this.channelLoaded)
            return;

        let loader = this.loadingCtrl.create({content: "Setting Channel..."});
        loader.present();

        //noinspection TypeScriptUnresolvedVariable
        Pro.deploy.configure({channel: this.updateChannel}).then((res)=>{
            loader.dismiss();
        }).catch((err)=>{
            loader.dismiss().then(()=> {
                this.utils.showAlert("Failed", "Could not set update channel.");
            });
        });
    }

    /* Not supported at the moment
    public rollbackVersion(){

        Pro.deploy.getCurrentVersion().then((curVersion)=>{

            if (!curVersion){
                this.utils.showAlert("Not Available", "There is no other snapshot to roll back to.");
                return;
            }

            let alert = this.alertCtrl.create({
                title: "Rollback",
                message: "Are you sure? You will not be able to upgrade to this version again if it's been superseded.",
                buttons: [
                    {
                        text: "No",
                        role: "cancel"
                    },
                    {
                        text: "Yes",
                        handler: ()=> {
                            Pro.deploy.deleteVersionById(curVersion.versionId).then((res)=>{
                                if (!res){
                                    this.utils.showAlert("Rollback failed", "Failed to remove the current snapshot. Rollback was not successful.");
                                    return;
                                }
                                Pro.deploy.reloadApp();
                            });
                        }
                    }
                ]
            });

            alert.present();

        });
    }*/

}
