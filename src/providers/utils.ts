import { Injectable } from '@angular/core';
import { PreferencesProvider } from "./preferences/preferences";
import { ToastController } from "ionic-angular/index";
import { Vibration } from '@ionic-native/vibration';
import { AlertController } from "ionic-angular/index";

/*
 Generated class for the CacheProvider provider.

 See https://angular.io/guide/dependency-injection for more info on providers
 and Angular DI.
 */
@Injectable()
export class UtilsProvider {

    constructor(public prefs:PreferencesProvider, public toastCtrl:ToastController, public vibration:Vibration, public alertCtrl: AlertController) {
        console.log('Hello CacheProvider Provider');
    }

    showAlert(title, message, debugData = null){

        let alert = this.alertCtrl.create({
            title: title,
            subTitle: message,
            buttons: ['Dismiss']
        });

        alert.present();

        return alert;
    }

    public playScanSuccessSound(){

        var key = this.prefs.getPreference("success_sound");
        if (key != ""){
            this.playSound(key);
        }
    }

    public playPromptSound(vibrate=false){

        var key = this.prefs.getPreference("prompt_sound");
        if (key != ""){
            this.playSound(key);
        }

        if (!vibrate)
            return;

        var vibrate = this.prefs.getPreference("alert_vibrate");
        if (vibrate)
            this.vibrate();
    }

    public playFailedSound(vibrate=false){

        var key = this.prefs.getPreference("alert_sound");
        if (key != ""){
            this.playSound(key);
        }

        if (!vibrate)
            return;

        var vibrate = this.prefs.getPreference("alert_vibrate");
        if (vibrate)
            this.vibrate();
    }

    public playSound(key){

        console.log("play: " + key);

        var audio = new Audio("assets/sounds/" + key + ".mp3");

        audio.play();
    }

    public vibrate(){
        this.vibration.vibrate(1000);
    }

}
