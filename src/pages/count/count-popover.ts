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
import { ViewController, NavController } from "ionic-angular";
import { UserguidePage } from "../about/userguide/userguide";
import {PreferencesProvider} from "../../providers/core/preferences";

@Component({
    template: `
    <ion-list no-margin>
        <button ion-item (click)="openUserguide()">About Counts</button>
        <ion-item>
            <ion-label>Confirm new lines</ion-label>
            <ion-toggle [(ngModel)]="prefs.preferences['count_confirm_new']" (ionChange)="prefs.savePreferences();"></ion-toggle>
        </ion-item>
    </ion-list>
  `
})
export class CountPopover {

    constructor(public viewCtrl: ViewController, public navCtrl:NavController, public prefs:PreferencesProvider) {}

    dismiss() {
        this.viewCtrl.dismiss();
    }

    openUserguide(){
        this.navCtrl.push(UserguidePage, {active: 'counts'});
        this.dismiss();
    }
}