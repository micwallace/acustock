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
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { CountProvider } from '../../../../providers/app/count'

@IonicPage()
@Component({
    selector: 'page-count-pending',
    templateUrl: 'pending-list.html'
})
export class CountEntryPendingTab {

    objectKeys:any = Object.keys;

    constructor(public navCtrl:NavController, public navParams:NavParams, public countProvider:CountProvider, public alertCtrl:AlertController) {

    }

    editReceiptItem(line, key, item) {
        // TODO: finish this
        /*let alertDialog = this.alertCtrl.create({
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

                        if (data.qty <= 0)
                            return this.countProvider.removeReceiptItem(line, key);

                        var remQty = this.countProvider.getCommittedRemainingQty(line);

                        if (remQty < data.qty){
                            this.utils.showAlert("Error", "The entered quantity is " + data.qty + " but there is only " + remQty + " left to receive.");
                            return false;
                        }

                        this.countProvider.updateReceiptItem(line, key, data.qty);
                    }
                }
            ]
        });
        alertDialog.present();*/
    }

    removeReceiptItem(line, key) {
        /*let alert = this.alertCtrl.create({
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
                        this.countProvider.removeReceiptItem(line, key);
                    }
                }
            ]
        });
        alert.present();*/
    }

}
