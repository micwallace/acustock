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
import { IonicPage, NavController, LoadingController, AlertController, PopoverController, ModalController, Events } from 'ionic-angular';
import { ReceiveProvider } from "../../providers/app/receive";
import { ReceiveListPage } from "./list/receive-list";
import { ReceiveShipmentPage } from "./shipment/receive-shipment";
import { UtilsProvider } from "../../providers/core/utils";
import { ReceivePopover } from "./receive-popover";

@IonicPage()
@Component({
    selector: 'page-receive',
    templateUrl: 'receive.html',
})
export class ReceivePage {

    public receiptType = "transfer";
    public referenceNbr = "";

    constructor(public navCtrl:NavController,
                public barcodeScanner:BarcodeScanner,
                public loadingCtrl:LoadingController,
                public receiveProvider:ReceiveProvider,
                public alertCtrl: AlertController,
                public utils:UtilsProvider,
                public popoverCtrl:PopoverController,
                public modalCtrl:ModalController,
                public events:Events) {

    }

    barcodeScanHandler = (barcodeText)=>{
        if (!(this.navCtrl.getActive().instance instanceof ReceivePage))
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
        let popover = this.popoverCtrl.create(ReceivePopover);
        popover.present({ev:event});
    }

    openReceiveList(){
        let loader = this.loadingCtrl.create({content: "Loading..."});
        loader.present();

        this.receiveProvider.getReceiveList(this.receiptType).then((receiveList)=>{

            console.log(JSON.stringify(receiveList));

            loader.dismiss();

            let modal = this.modalCtrl.create(ReceiveListPage, {list: receiveList, type: this.receiptType});

            modal.onDidDismiss(data => {
                if (data && data.referenceNbr) {
                    this.loadReceipt(data.referenceNbr);
                }
            });

            modal.present();

        }).catch((err)=> {
            loader.dismiss();
            this.utils.processApiError("Error", err.message, err, this.navCtrl);
        });
    }

    loadReceipt(referenceNbr, isScan=false){

        this.referenceNbr = referenceNbr;

        let loader = this.loadingCtrl.create({content: "Loading..."});
        loader.present();

        this.receiveProvider.loadReceipt(this.referenceNbr, this.receiptType).then(()=> {

            loader.dismiss();
            this.receiptType = this.receiveProvider.type;

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
            this.utils.showAlert("Error", "Error accessing barcode device: " + err, {exception: err});
        });
    }

    onBarcodeScan(barcodeText){
        this.loadReceipt(barcodeText, true);
    }

    addReceipt() {

        if (this.receiveProvider.type == "shipment") {

            if (this.receiveProvider.sourceDocument.Status.value !== "Open"){

                if (this.receiveProvider.sourceDocument.Status.value === "Confirmed"){

                    let dialog = this.alertCtrl.create({
                        title: 'Re-Open Shipment',
                        message: 'This shipment is already confirmed, do you want to correct?',
                        buttons: [
                            {
                                text: 'Cancel',
                                role: 'cancel',
                                handler: () => {}
                            },
                            {
                                text: 'OK',
                                handler: () => {

                                    let loader = this.loadingCtrl.create({content: "Re-opening shipment..."});
                                    loader.present();

                                    this.receiveProvider.correctShipment().then(()=>{
                                        this.receiveProvider.sourceDocument.Status.value = "Open";

                                        loader.dismiss();
                                        //noinspection TypeScriptValidateTypes
                                        this.navCtrl.push(ReceiveShipmentPage);
                                    }).catch((err)=>{
                                        loader.dismiss().then(()=>{
                                            this.utils.processApiError("Error", err.message, err, this.navCtrl);
                                        });
                                    });
                                }
                            }
                        ]
                    });

                    dialog.present();

                } else {

                    this.utils.showAlert("Error", "This receipt shipment is completed and cannot be edited.");
                    return;
                }
                return;
            }

        } else {

            if (this.receiveProvider.type == "transfer" && this.receiveProvider.sourceDocument.Status.value !== "Released"){
                this.utils.showAlert("Error", "Unable to add receipt: the transfer document has not been released.");
                return;
            }

            if (this.receiveProvider.type == "purchase" && this.receiveProvider.sourceDocument.Status.value !== "Open"){
                this.utils.showAlert("Error", "Unable to add receipt: the purchase order status is not open.");
                return;
            }

            if (this.receiveProvider.unreceivedQty == 0) {
                this.utils.showAlert("Error", "There are no items left to receive.");
                return;
            }
        }

        //noinspection TypeScriptValidateTypes
        this.navCtrl.push(ReceiveShipmentPage);
    }

    updateIN(){

        let dialog = this.alertCtrl.create({
            title: 'Update Inventory',
            message: 'This will create the issue document in Acumatica so stock levels are updated. This process cannot be reversed, are you sure?',
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    handler: () => {}
                },
                {
                    text: 'OK',
                    handler: () => {

                        let loader = this.loadingCtrl.create({content: "Updating Inventory..."});
                        loader.present();

                        this.receiveProvider.updateIN().then(()=>{
                            loader.dismiss();
                        }).catch((err)=>{
                            loader.dismiss().then(()=>{
                                this.utils.processApiError("Error", err.message, err, this.navCtrl);
                            });
                        });
                    }
                }
            ]
        });

        dialog.present();
    }

}
