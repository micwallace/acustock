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
import { IonicPage, NavController, LoadingController, PopoverController, ModalController, Events } from 'ionic-angular';
import { CountProvider } from "../../providers/app/count";
import { CountEntryPage } from "./entry/count-entry";
import { UtilsProvider } from "../../providers/core/utils";
import { CountPopover } from "./count-popover";
import { CountsListPage } from "./list/counts-list";

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
                public utils:UtilsProvider,
                public events:Events,
                public modalCtrl:ModalController) {
    }

    barcodeScanHandler = (barcodeText)=>{
        if (!(this.navCtrl.getActive().instance instanceof CountPage))
            return;

        this.onBarcodeScan(barcodeText)
    };

    ionViewDidLoad() {
        this.events.unsubscribe('barcode:scan');
        this.events.subscribe('barcode:scan', this.barcodeScanHandler);
    }

    /*ionViewWillUnload() {
        this.events.unsubscribe('barcode:scan', this.barcodeScanHandler);
    }*/

    presentPopover(event) {
        let popover = this.popoverCtrl.create(CountPopover);
        popover.present({ev:event});
    }

    openCountList(){
        let loader = this.loadingCtrl.create({content: "Loading..."});
        loader.present();

        this.countProvider.getCountList().then((countList)=>{

            loader.dismiss();

            let modal = this.modalCtrl.create(CountsListPage, {list: countList});

            modal.onDidDismiss(data => {
                if (data && data.referenceNbr) {
                    this.loadCount(data.referenceNbr);
                }
            });

            modal.present();

        }).catch((err)=> {
            loader.dismiss();
            this.utils.processApiError("Error", err.message, err, this.navCtrl);
        });
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
        this.barcodeScanner.scan({resultDisplayDuration:0}).then((barcodeData) => {
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
