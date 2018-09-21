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
import { IonicPage, Events, AlertController } from 'ionic-angular';
import { PickProvider } from '../../../../providers/providers';

@IonicPage()
@Component({
    selector: 'tabs-pick-list',
    templateUrl: 'pick-list.html'
})
export class PickListTab {

    objectKeys:any = Object.keys;

    constructor(public pickProvider:PickProvider,
                public alertCtrl:AlertController,
                public events:Events) {

    }

    editPickItem(item) {
        let alertDialog = this.alertCtrl.create({
            title: 'Update Quantity',
            inputs: [
                {
                    name: 'qty',
                    placeholder: 'Quantity',
                    value: item.PendingQty
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

                        if (data.qty > this.pickProvider.getPendingItem(item.LineNbr.value).RemainingQty){
                            alert("The entered value exceed the required qty for this item.");
                        } else {
                            this.pickProvider.updatePick(item.LineNbr.value, item.id, data.qty);
                        }
                    }
                }
            ]
        });
        alertDialog.present();
    }

    removePickItem(item) {
        let alert = this.alertCtrl.create({
            title: 'Remove Pick',
            message: 'Are you sure you want to remove this pick?',
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
                        this.pickProvider.updatePick(item.LineNbr.value, item.id, 0);
                    }
                }
            ]
        });
        alert.present();
    }

    confirmPicks(){
        this.events.publish('picks:confirm');
    }

    cancelPicks(){
        this.events.publish('picks:cancel');
    }

}
