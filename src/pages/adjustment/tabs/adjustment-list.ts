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
import { IonicPage, NavController, NavParams, AlertController, Events } from 'ionic-angular';
import { AdjustmentProvider } from '../../../providers/app/adjustment'
import { UtilsProvider } from "../../../providers/core/utils";
/**
 * Generated class for the PickShipmentsListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-adjustment',
    templateUrl: 'adjustment-list.html'
})
export class AdjustmentListTab {

    objectKeys:any = Object.keys;

    constructor(public navCtrl:NavController,
                public navParams:NavParams,
                public adjustmentProvider:AdjustmentProvider,
                public alertController:AlertController,
                public utils:UtilsProvider,
                public events:Events) {
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad AdjustmentPage Tab: Pick List');
    }

    editItem(locationId, itemId) {

        var qty = this.adjustmentProvider.getItemPendingPhysicalQty(itemId, locationId);

        var alertDialog = this.alertController.create({
            title: 'Update Physical Qty',
            inputs: [
                {
                    name: 'qty',
                    placeholder: 'Quantity',
                    value: qty
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
                        this.adjustmentProvider.updatePendingItemQty(locationId, itemId, data.qty);
                    }
                }
            ]
        });
        alertDialog.present();
    }

    deleteItem(locationId, itemId) {

        if (!confirm("Are you sure?"))
            return;

        this.adjustmentProvider.removePendingItem(locationId, itemId);
    }

    commitAdjustments(){
        this.events.publish('adjustments:commit');
    }

}
