import { Injectable } from '@angular/core';
import { PreferencesProvider } from "./preferences";
import { App, ToastController, AlertController, NavController } from "ionic-angular";
import { Vibration } from '@ionic-native/vibration';
import { EmailComposer } from '@ionic-native/email-composer';
import { LoginPage } from "../../pages/login/login";
import { SetupPage } from "../../pages/setup/setup";

/*
 Generated class for the CacheProvider provider.

 See https://angular.io/guide/dependency-injection for more info on providers
 and Angular DI.
 */
@Injectable()
export class UtilsProvider {

    constructor(private app:App,
                public prefs:PreferencesProvider,
                public toastCtrl:ToastController,
                public vibration:Vibration,
                public alertCtrl: AlertController,
                public emailComposer:EmailComposer) {
    }

    public processApiError(title, message, err, navCtrl:NavController=null){

        if (err.hasOwnProperty('status')){
            // Check for login error and show login screen
            if (err.status == 401) {
                if (navCtrl != null)
                    navCtrl.setRoot('LoginPage');
                // If the error is
                this.showAlert('Login Failed', err.authFailed ? err.responseData.exceptionMessage : "Your session expired, please login again.");
                return;
            // Check for connection failure; show setup screen
            } else if (err.status < 1){
                if (navCtrl != null)
                    navCtrl.setRoot('SetupPage');
                this.showAlert('Connection Failed', 'Error connecting to Acumatica: '+err.message, err);
                return;
            }
        }

        this.showAlert(title, message, err);
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

    public limitKeyNumber(e){
        // https://stackoverflow.com/questions/995183/how-to-allow-only-numeric-0-9-in-html-inputbox-using-jquery/995193#995193
        var key = e.charCode || e.keyCode || 0;
        // allow backspace, tab, delete, enter, arrows, numbers and keypad numbers ONLY
        // home, end, period, and numpad decimal
        if (key == 8 || key == 9 || key == 13 ||
            key == 46 || key == 110 || key == 190 ||
            (key >= 35 && key <= 40) ||
            (key >= 48 && key <= 57) ||
            (key >= 96 && key <= 105))
            return;

        e.preventDefault();
    }

}
