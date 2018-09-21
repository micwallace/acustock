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
import { TransferProvider } from '../../../providers/app/transfer'
import { UtilsProvider } from "../../../providers/core/utils";

@IonicPage()
@Component({
    selector: 'page-bin-transfer',
    templateUrl: 'transfer-list.html'
})
export class TransferListTab {

    objectKeys:any = Object.keys;

    constructor(public navCtrl:NavController,
                public navParams:NavParams,
                public transferProvider:TransferProvider,
                public alertController:AlertController,
                public utils:UtilsProvider) {
    }

    openEditDialog(locationKey, itemKey) {

        var location = this.transferProvider.getPendingItem(locationKey);
        var curItemQty = location.Items[itemKey].Qty.value;

        var alertDialog = this.alertController.create({
            title: 'Update Qty',
            inputs: [
                {
                    name: 'qty',
                    placeholder: 'Quantity',
                    value: curItemQty
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
                    text: 'Update',
                    handler: data => {
                        var qty = parseFloat(data.qty);
                        var curPending = this.transferProvider.getItemLocPendingQty(locationKey.split("#")[0], itemKey);
                        var srcQty = location.srcQty;

                        var newPending = (qty - curItemQty) + curPending;

                        if (newPending <= srcQty) {
                            this.transferProvider.updatePendingItemQty(locationKey, itemKey, qty);
                        } else {
                            this.utils.showAlert("Error", "There is only " + srcQty + " on hand to transfer from this location.");
                        }
                    }
                }
            ]
        });
        alertDialog.present();
    }

    deleteItem(locationKey, itemKey) {

        if (!confirm("Are you sure?"))
            return;

        this.transferProvider.removePendingItem(locationKey, itemKey);
    }

}
