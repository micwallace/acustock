import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
import { PreferencesProvider, CacheProvider } from '../../providers/providers'
import { UtilsProvider } from "../../providers/utils";

/**
 * Generated class for the PreferencesPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-preferences',
    templateUrl: 'preferences.html',
})
export class PreferencesPage {

    preferences;
    currentWarehouse = "";

    constructor(public navCtrl:NavController, public navParams:NavParams, public prefs:PreferencesProvider, public events:Events, public cache:CacheProvider, public utils:UtilsProvider) {
        this.preferences = prefs;
        this.currentWarehouse = prefs.getPreference('warehouse');
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad PreferencesPage');
    }

    ionViewWillLeave() {
        this.prefs.savePreferences();

        if (this.prefs.getPreference('warehouse') !== this.currentWarehouse)
            this.cache.generateBinList();

        setTimeout(()=> {
            this.events.publish('preferencesSaved');
        }, 200);
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

    onSelectOptionClick(key, value){
        if (["success_sound", "alert_sound", "prompt_sound"].indexOf(key) > -1){
            this.utils.playSound(value);
        } else if (key == "warehouse"){
            this.cache.generateBinList();
        }
    }

}
