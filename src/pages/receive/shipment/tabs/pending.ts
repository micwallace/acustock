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
import { IonicPage, Events, AlertController, PopoverController } from 'ionic-angular';
import { ReceiveProvider } from '../../../../providers/app/receive'
import { UtilsProvider } from "../../../../providers/core/utils";
import { ReceivePopover } from "../../receive-popover";

@IonicPage()
@Component({
    selector: 'page-receive',
    templateUrl: 'pending.html'
})
export class ReceiveShipmentPendingTab {

    objectKeys:any = Object.keys;

    constructor(public receiveProvider:ReceiveProvider,
                public alertCtrl:AlertController,
                public popoverCtrl:PopoverController,
                public utils:UtilsProvider,
                public events:Events) {

    }

    presentPopover(event) {
        let popover = this.popoverCtrl.create(ReceivePopover);
        popover.present({ev:event});
    }

    editReceiptItem(line, key, item) {
        let alertDialog = this.alertCtrl.create({
            title: 'Update Quantity',
            inputs: [
                {
                    name: 'qty',
                    placeholder: 'Quantity',
                    value: item.Qty
                }
            ],
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    handler: data => {
                    }
                },
                {
                    text: 'Ok',
                    handler: data => {

                        if (!data.qty)
                            return this.receiveProvider.removeReceiptItem(line, key);

                        var remQty = this.receiveProvider.getCommittedRemainingQty(line);

                        if (remQty < data.qty){
                            this.utils.showAlert("Error", "The entered quantity is " + data.qty + " but there is only " + remQty + " left to receive.");
                            return false;
                        }

                        this.receiveProvider.updateReceiptItem(line, key, data.qty);
                    }
                }
            ]
        });
        alertDialog.present();
    }

    removeReceiptItem(line, key) {
        let alert = this.alertCtrl.create({
            title: 'Remove Receipt',
            message: 'Are you sure you want to remove this receipt item?',
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    handler: () => {
                    }
                },
                {
                    text: 'OK',
                    handler: () => {
                        this.receiveProvider.removeReceiptItem(line, key);
                    }
                }
            ]
        });
        alert.present();
    }

    confirmReceipts(){
        this.events.publish('receipts:confirm');
    }

    clearReceipts(){
        this.events.publish('receipts:clear');
    }

}
