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
import { ViewController, NavController, App } from "ionic-angular";
import { PreferencesProvider } from "../../providers/core/preferences";
import {UserguidePage} from "../about/userguide/userguide";

@Component({
    template: `
    <ion-list no-margin>
        <button ion-item (click)="openUserguide()">About Receipts</button>
        <ion-item>
            <ion-label>Release Receipts</ion-label>
            <ion-toggle [(ngModel)]="prefs.preferences['release_receipts']"></ion-toggle>
        </ion-item>
        <ion-item>
            <ion-label>Keep Location</ion-label>
            <ion-toggle [(ngModel)]="prefs.preferences['receipt_keep_loc']"></ion-toggle>
        </ion-item>
    </ion-list>
  `
})
export class ReceivePopover {

    constructor(public viewCtrl: ViewController, public navCtrl:NavController,
                public app:App, public prefs:PreferencesProvider) {

    }

    openUserguide(){
        this.viewCtrl.dismiss().then(()=> {
            this.app.getRootNav().push(UserguidePage, {active: 'receipts'});
        });
    }
}