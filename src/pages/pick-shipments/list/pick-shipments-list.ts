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
import { IonicPage, NavController, NavParams, ModalController  } from 'ionic-angular';
import { PickProvider } from '../../../providers/providers';

/**
 * Generated class for the PickShipmentsListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-pick-shipments-list',
    templateUrl: 'pick-shipments-list.html'
})
export class PickShipmentsListPage {

    constructor(public pickProvider:PickProvider) {
        console.log("Page opened");
        console.log(JSON.stringify(this.pickProvider.currentShipment));
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad PickShipmentsListPage');
    }

}
