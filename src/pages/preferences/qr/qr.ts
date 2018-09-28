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
import { ViewController, NavController } from "ionic-angular";
import { PreferencesProvider } from "../../../providers/core/preferences";
import { UtilsProvider } from "../../../providers/core/utils";
import { SocialSharing } from '@ionic-native/social-sharing';

@Component({
    templateUrl: 'qr.html'
})
export class QRPage {

    qr = null;

    constructor(public viewCtrl: ViewController, public navCtrl:NavController,
                public prefs:PreferencesProvider, public utils:UtilsProvider, public sharing:SocialSharing) {

    }

    ionViewDidLoad(){

        var minPrefs = {};

        for (var i in this.prefs.preferences){
            var key = this.prefs.minMap.hasOwnProperty(i) ? this.prefs.minMap[i] : i;
            minPrefs[key] = this.prefs.preferences[i];
        }

        this.qr = JSON.stringify(minPrefs);
    }

    dismiss() {
        this.viewCtrl.dismiss();
    }

    private static getQRCodeString(){

        var imgs = document.getElementById('qrcode').getElementsByTagName('img');

        if (imgs.length > 0){

            var imgSrc = imgs[0].src;

            //imgSrc = imgSrc.substring(imgSrc.indexOf(',') + 1);
            console.log(imgSrc);

            return imgSrc;
        }

        return "";
    }

    shareQR(){
        this.sharing.share("Scan this QR code on the setup screen of other devices to quickly set them up.", "AcuStock setup QR", QRPage.getQRCodeString()).catch((err)=>{
            this.utils.showAlert("Error", err);
        });
    }
}