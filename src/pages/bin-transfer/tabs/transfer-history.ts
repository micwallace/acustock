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
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { TransferProvider } from '../../../providers/app/transfer'

/**
 * Generated class for the PickShipmentsListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-bin-transfer',
    templateUrl: 'transfer-history.html'
})
export class TransferHistoryTab {

    constructor(public navCtrl:NavController,
                public navParams:NavParams,
                public transferProvider:TransferProvider) {

    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad PickShipmentPickPage Tab: Unpicked List');
    }

    openPickItem(item) {

    }

}
