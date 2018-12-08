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

import { Injectable } from '@angular/core';
import { PreferencesProvider } from "./preferences";
import { AlertController, NavController } from "ionic-angular";
import { Vibration } from '@ionic-native/vibration';
import { EmailComposer } from '@ionic-native/email-composer';
//import { LoginPage } from "../../pages/login/login";
//import { SetupPage } from "../../pages/setup/setup";

/*
 Generated class for the CacheProvider provider.

 See https://angular.io/guide/dependency-injection for more info on providers
 and Angular DI.
 */
@Injectable()
export class UtilsProvider {

    constructor(public prefs:PreferencesProvider,
                public vibration:Vibration,
                public alertCtrl: AlertController,
                public emailComposer:EmailComposer) {
    }

    public processApiError(title, message, exception, navCtrl:NavController=null, additionalData=null){

        if (exception.hasOwnProperty('status')){
            // Check for login error and show login screen
            if (exception.status == 401) {
                if (navCtrl != null)
                    navCtrl.setRoot('LoginPage');
                // If the error is
                this.showAlert('Login Failed', exception.authFailed ? exception.responseData.exceptionMessage : "Your session expired, please login again.");
                return;
            // Check for connection failure; show setup screen
            } else if (exception.status < 1){
                if (navCtrl != null)
                    navCtrl.setRoot('SetupPage');
                this.showAlert('Connection Failed', 'Error connecting to Acumatica: '+exception.message, exception);
                return;
            }
        }

        this.showAlert(title, message, exception, additionalData);
    }

    public showAlert(title, message, exception = null, additionalData=null){

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

        if (exception != null)
            alert.addButton({
                text: 'Email Diagnostics',
                handler: () => {
                    this.sendDebugData(exception, additionalData);
                }
            });

        alert.present();

        return alert;
    }

    public sendDebugData(exception, additionalData){

        var errorData = {exception: exception, additionalData: additionalData};

        this.emailComposer.isAvailable().then(() =>{

            let email = {
                attachments: [
                    'base64:error-information.json//' + btoa(JSON.stringify(errorData))
                ],
                subject: 'AcuStock Error Report',
                body: (exception.hasOwnProperty('exception') ? 'Error Summary: ' + exception.exception.message + '<br/>' : '') + 'Additional Information:',
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

    public formatDatetime(timestamp, includeTime=false){

        if (!timestamp)
            return "";

        let date = new Date(timestamp);

        let month:any = date.getMonth() + 1;
        let day:any = date.getDate();

        month = (month < 10 ? "0" : "") + month;
        day = (day < 10 ? "0" : "") + day;

        var dateStr = day+"/"+month+"/"+date.getFullYear();

        if (includeTime){
            let hour:any = date.getHours();
            let min:any = date.getMinutes();
            let sec:any = date.getSeconds();
            hour = (hour < 10 ? "0" : "") + hour;
            min = (min < 10 ? "0" : "") + min;
            sec = (sec < 10 ? "0" : "") + sec;
            dateStr += " "+hour+":"+min+":"+sec;
        }

        return dateStr;
    }

}
