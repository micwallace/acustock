import { Injectable } from '@angular/core';
import { PreferencesProvider } from "./preferences/preferences";
import { ToastController } from "ionic-angular/index";
import { Vibration } from '@ionic-native/vibration';
import { EmailComposer } from '@ionic-native/email-composer';
import { AlertController } from "ionic-angular/index";

/*
 Generated class for the CacheProvider provider.

 See https://angular.io/guide/dependency-injection for more info on providers
 and Angular DI.
 */
@Injectable()
export class UtilsProvider {

    constructor(public prefs:PreferencesProvider, public toastCtrl:ToastController, public vibration:Vibration, public alertCtrl: AlertController, public emailComposer:EmailComposer) {
        console.log('Hello CacheProvider Provider');
    }

    public showAlert(title, message, debugData = null){

        let alert = this.alertCtrl.create({
            title: title,
            subTitle: message,
            buttons: [
                {
                    text: 'Dismiss',
                    role: 'cancel'
                }
            ]
        });

        if (debugData != null)
            alert.addButton({
                text: 'Email Diagnostics',
                handler: () => {
                    this.sendDebugData(debugData);
                }
            });

        alert.present();

        return alert;
    }

    public sendDebugData(debugData){

        this.emailComposer.isAvailable().then(() =>{

            let email = {
                attachments: [
                    'base64:error-information.json//' + btoa(JSON.stringify(debugData))
                ],
                subject: 'AcuShip Error Report',
                body: (debugData.hasOwnProperty('exception') ? 'Error Summary: ' + debugData.exception.message + '<br/>' : '') + 'Additional Information:',
                isHtml: true
            };

            this.emailComposer.open(email);

        }).catch((err)=>{
            this.showAlert("Email not available", "The email composer plugin is not available on this platform: "+JSON.stringify(err));
        });
    }

    public playScanSuccessSound(){

        var key = this.prefs.getPreference("success_sound");
        if (key != ""){
            UtilsProvider.playSound(key);
        }
    }

    public playPromptSound(vibrate=false){

        var key = this.prefs.getPreference("prompt_sound");
        if (key != ""){
            UtilsProvider.playSound(key);
        }

        if (!vibrate)
            return;

        var vibrate:boolean = this.prefs.getPreference("alert_vibrate");
        if (vibrate)
            this.vibrate();
    }

    public playFailedSound(vibrate=false){

        var key = this.prefs.getPreference("alert_sound");
        if (key != ""){
            UtilsProvider.playSound(key);
        }

        if (!vibrate)
            return;

        var vibrate:boolean = this.prefs.getPreference("alert_vibrate");
        if (vibrate)
            this.vibrate();
    }

    public static playSound(key){

        var audio = new Audio("assets/sounds/" + key + ".mp3");

        audio.play();
    }

    public vibrate(){
        this.vibration.vibrate(1000);
    }

}
