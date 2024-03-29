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
import { AlertController, NavController, Platform } from "ionic-angular";
import { Vibration } from '@ionic-native/vibration';
import { EmailComposer } from '@ionic-native/email-composer';
import { NativeAudio } from "@ionic-native/native-audio";
//import { LoginPage } from "../../pages/login/login";
//import { SetupPage } from "../../pages/setup/setup";

/*
 Generated class for the CacheProvider provider.

 See https://angular.io/guide/dependency-injection for more info on providers
 and Angular DI.
 */
@Injectable()
export class UtilsProvider {

    private audioMode = "html";

    private preloadedSounds = {};

    constructor(public prefs:PreferencesProvider,
                public vibration:Vibration,
                public alertCtrl: AlertController,
                public emailComposer:EmailComposer,
                public platform:Platform,
                public nativeAudio:NativeAudio) {

        this.platform.ready().then(() => {
            if (this.platform.is('cordova') && this.prefs.getPreference('native_audio'))
                this.audioMode = "native";
        });
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
            message: message,
            buttons: [
                {
                    text: 'Dismiss',
                    role: 'cancel'
                }
            ]
        });

        if (exception != null) {
            alert.addButton({
                text: 'Email Diagnostics',
                handler: () => {
                    this.sendDebugData(exception, additionalData);
                }
            });

            // TODO: Add ionic pro error reporting
        }

        alert.present();

        return alert;
    }

    public sendDebugData(exception, additionalData){

        let errorData = {exception: exception, additionalData: additionalData};

        this.emailComposer.isAvailable().then(() =>{

            let email = {
                to: this.prefs.getPreference('error_email'),
                attachments: [
                    'base64:error-information.json//' + btoa(JSON.stringify(errorData))
                ],
                subject: 'AcuStock Error Report',
                body: (exception.hasOwnProperty('message') ? 'Error Summary: ' + exception.message + '<br/><br/>' : '') +
                        (exception.hasOwnProperty('stack') ? 'Stacktrace: ' + exception.stack + '<br/><br/>' : '') +
                        '<br/>Additional Information:' +
                        '<br/>Device: ' + this.prefs.getPreference('device') +
                        '<br/>Company: ' + this.prefs.getPreference('connection_company') +
                        '<br/>Warehouse: ' + this.prefs.getPreference('warehouse'),
                isHtml: true
            };

            this.emailComposer.open(email);

        }).catch((err)=>{
            this.showAlert("Email not available", "The email composer plugin is not available on this platform. Error Details:\r\n"+JSON.stringify(exception) + "\r\n" + JSON.stringify(additionalData));
        });
    }

    public sendShortShipNotification(shortShipData){

        this.emailComposer.isAvailable().then(() =>{

            let body = "Hello,<br/><br/>The following items on shipment "+shortShipData.shipment+
                        " were not available in the warehouse and are from orders with the \"ship complete\" shipping rule. " +
                "If you want the shipment to proceed, please change the order and line level shipping rule to either backorder allowed or cancel remainder and notify the warehouse.<br/><br/>";

            body += "Order Nbr.".padEnd(16, '\u00A0') + "Inventory ID".padEnd(28, '\u00A0') + "Descr.".padEnd(44, '\u00A0') + "Qty. Requested".padEnd(20, '\u00A0') + "Qty. Not Available<br/>";

            for (let i in shortShipData.items){

                if (!shortShipData.items.hasOwnProperty(i))
                    continue;

                let item = shortShipData.items[i];

                body += item.order.padEnd(16, '\u00A0') + item.item.padEnd(28, '\u00A0') + item.description.padEnd(44, '\u00A0') + item.qty.toString().padEnd(20, '\u00A0') + item.qty_left+"<br/>";
            }

            let email = {
                to: this.prefs.getPreference('service_email'),
                subject: 'AcuStock Items not available for shipment #'+shortShipData.shipment,
                body: body,
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

        var vibrate:boolean = this.prefs.getPreference("alert_vibrate");
        if (vibrate)
            this.vibrate();
    }

    public playCompletedSound(vibrate=false){

        var key = this.prefs.getPreference("completed_sound");
        if (key != ""){
            this.playSound(key);
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
            this.playSound(key);
        }

        if (!vibrate)
            return;

        var vibrate:boolean = this.prefs.getPreference("alert_vibrate");
        if (vibrate)
            this.vibrate();
    }

    public playSound(key){

        let path = "assets/sounds/" + key + ".mp3";

        if (this.audioMode == "html") {

            var audio = new Audio(path);

            audio.play();

        } else {

            if (this.preloadedSounds.hasOwnProperty(key)) {

                this.nativeAudio.play(key).then((res) => {
                    //console.log(res);
                }, (err) => {
                    console.log(err);
                });

            } else {

                this.nativeAudio.preloadSimple(key, path).then((res)=>{

                    this.preloadedSounds[key] = true;

                    this.nativeAudio.play(key).then((res) => {
                        //console.log(res);
                    }, (err) => {
                        console.log(err);
                    });

                }, (err) => {
                    console.log(err);
                });
            }
        }
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
