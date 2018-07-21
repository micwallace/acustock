import { Injectable } from '@angular/core';
import { PreferencesProvider } from "./preferences/preferences";
import { ToastController } from "ionic-angular/index";

/*
 Generated class for the CacheProvider provider.

 See https://angular.io/guide/dependency-injection for more info on providers
 and Angular DI.
 */
@Injectable()
export class UtilsProvider {

    constructor(public prefs:PreferencesProvider, public toastCtrl:ToastController) {
        console.log('Hello CacheProvider Provider');
    }

    public playScanSuccessSound(){

    }

    public playScanFailSound(){

    }

    public playSound(key){

        var audio = new Audio(key + "mp3");

        audio.play();


    }


}
