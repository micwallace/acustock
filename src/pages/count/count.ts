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
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { IonicPage, NavController, LoadingController, PopoverController } from 'ionic-angular';
import { CountProvider } from "../../providers/app/count";
import { CountEntryPage } from "./entry/count-entry";
import { UtilsProvider } from "../../providers/core/utils";
import { CountPopover } from "./count-popover";

@IonicPage()
@Component({
    selector: 'page-count',
    templateUrl: 'count.html',
})
export class CountPage {

    public referenceNbr = "";

    constructor(public navCtrl:NavController,
                public popoverCtrl:PopoverController,
                public barcodeScanner:BarcodeScanner,
                public loadingCtrl:LoadingController,
                public countProvider:CountProvider,
                public utils:UtilsProvider) {
    }

    presentPopover(event) {
        let popover = this.popoverCtrl.create(CountPopover);
        popover.present({ev:event});
    }

    isActive(){
        return this.navCtrl.getActive().instance instanceof CountPage;
    }

    loadCount(referenceNbr, isScan=false){

        this.referenceNbr = referenceNbr;

        let loader = this.loadingCtrl.create({content: "Loading..."});
        loader.present();

        this.countProvider.loadCount(this.referenceNbr).then((res)=> {

            loader.dismiss();

        }).catch((err)=> {

            loader.dismiss();
            this.referenceNbr = "";
            this.utils.playFailedSound(isScan);
            this.utils.processApiError("Error", err.message, err, this.navCtrl);
        });
    }

    startCameraScanner() {
        this.barcodeScanner.scan().then((barcodeData) => {
            if (barcodeData.cancelled)
                return;

            this.onBarcodeScan(barcodeData.text);

        }, (err) => {
            // An error occurred
            this.utils.showAlert("Error", "Error accessing barcode device: " + err);
        });
    }

    onBarcodeScan(barcodeText){
        this.loadCount(barcodeText, true);
    }

    startCounting() {

        if (this.countProvider.physicalCount.Status.value != "Counting In Progress"){
            this.utils.showAlert("Error", "This physical count is not in progress and cannot be counted.");
            return;
        }

        //noinspection TypeScriptValidateTypes
        this.navCtrl.push(CountEntryPage);
    }

}
