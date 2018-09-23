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
import { NavController, ModalController, LoadingController, AlertController, PopoverController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { PickProvider } from '../../providers/app/pick';
import { PickShipmentsListPage } from "./list/pick-shipments-list";
import { PickShipmentsPickPage } from "./pick/pick-shipments-pick";
import { UtilsProvider } from "../../providers/core/utils";
import {PreferencesProvider} from "../../providers/core/preferences";
import { PickPopover } from "./pick-popover";

@Component({
    selector: 'page-pick-shipments',
    templateUrl: 'pick-shipments.html'
})
export class PickShipmentsPage {

    shipmentNbr = "";

    loader = null;

    constructor(public navCtrl:NavController,
                private barcodeScanner:BarcodeScanner,
                public pickProvider:PickProvider,
                public modalCtrl:ModalController,
                public loadingCtrl:LoadingController,
                public alertCtrl:AlertController,
                public utils:UtilsProvider,
                public prefs:PreferencesProvider,
                public popoverCtrl:PopoverController) {

    }

    presentPopover(event) {
        let popover = this.popoverCtrl.create(PickPopover);
        popover.present({ev:event});
    }

    isActive(){
        return this.navCtrl.getActive().instance instanceof PickShipmentsPage;
    }

    onBarcodeScan(barcodeData){
        this.loadShipment(barcodeData, true);
    }

    startCameraScanner() {
        this.barcodeScanner.scan().then((barcodeData) => {
            if (barcodeData.cancelled)
                return;

            this.onBarcodeScan(barcodeData.text);

        }, (err) => {
            // An error occurred
            this.utils.showAlert("Error", "Error accessing barcode device: " + err, {exception: err});
        });
    }

    loadShipment(shipmentNbr, isScan=false) {
        this.shipmentNbr = shipmentNbr;

        let loader = this.loadingCtrl.create({content: "Loading..."});
        loader.present();

        this.pickProvider.loadShipment(shipmentNbr).then((res)=> {
            loader.dismiss();
        }).catch((err)=> {
            loader.dismiss();
            this.shipmentNbr = "";
            this.utils.playFailedSound(isScan);
            this.utils.processApiError("Error", err.message, err, this.navCtrl);
        });
    }

    openItemsDialog() {
        console.log(JSON.stringify(this.pickProvider.currentShipment.Details));

        let modal = this.modalCtrl.create(PickShipmentsListPage);
        modal.present();
    }

    openPickDialog() {

        if (this.pickProvider.currentShipment.Status.value != "Open"){
            this.utils.showAlert("Error", "This shipment cannot be picked because it's status is not Open.");
            return;
        }

        if (this.pickProvider.unpickedQty == 0) {
            this.utils.showAlert("Error", "There are no items left to pick.");
            return;
        }

        this.loader = this.loadingCtrl.create({content: "Checking assignment..."});
        this.loader.present();

        this.pickProvider.refreshStatus().then((res)=>{

            if (this.pickProvider.currentShipment.PickStatus.value == "Assigned" && this.pickProvider.currentShipment.PickDevice.value != this.prefs.getPreference('device')){

                let alert = this.alertCtrl.create({
                    title: "Shipment Assigned",
                    message: "This shipment is already assigned to device "+this.pickProvider.currentShipment.PickDevice.value+". Would you like to release it and assign it to this device?",
                    buttons: [
                        {
                            text: "No",
                            role: "cancel"
                        },
                        {
                            text: "Yes",
                            handler: ()=> {
                                this.assignDeviceAndStartPick();
                            }
                        }
                    ]
                });

                this.dismissLoader().then(()=>{
                    alert.present();
                });
            } else {
                this.dismissLoader();
                //noinspection TypeScriptValidateTypes
                this.navCtrl.push(PickShipmentsPickPage);
            }
        }).catch((err)=>{
            this.dismissLoader().then(()=>{
                this.utils.processApiError("Error", err.message, err, this.navCtrl);
            })
        });

    }

    private assignDeviceAndStartPick(){

        if (this.loader == null) {
            this.loader = this.loadingCtrl.create({content: "Assigning shipment..."});
            this.loader.present();
        } else {
            this.loader.data.content = "Assigning shipment...";
        }

        this.pickProvider.assignShipment().then((res)=>{
            this.dismissLoader();
            //noinspection TypeScriptValidateTypes
            this.navCtrl.push(PickShipmentsPickPage);
            this.pickProvider.precacheAvailability();
        }).catch((err)=> {
            this.dismissLoader().then(()=>{
                this.utils.processApiError("Error", err.message, err, this.navCtrl);
            })
        });
    }

    private dismissLoader() {

        return new Promise((resolve, reject)=>{

            if (this.loader == null)
                return resolve();

            this.loader.dismiss().then(()=>{
                this.loader = null;
                resolve();
            }).catch((err)=>{
                resolve();
            });
        });
    }

}
