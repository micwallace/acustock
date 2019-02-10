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

import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, Events, Tabs } from 'ionic-angular';
import { ReceiveShipmentEnterTab } from "./tabs/shipment-enter";
import { ReceiveShipmentListTab } from "./tabs/list";
import { ReceiveShipmentPendingTab } from "./tabs/pending";
import { ReceiveProvider } from "../../../providers/app/receive";

@IonicPage()
@Component({
    selector: 'page-bin-transfer',
    templateUrl: 'receive-shipment.html',
})
export class ReceiveShipmentPage {

    @ViewChild("tabs") tabs: Tabs;

    tab1Root = ReceiveShipmentEnterTab;
    tab2Root = ReceiveShipmentPendingTab;
    tab3Root = ReceiveShipmentListTab;

    constructor(public navCtrl:NavController,
                public events:Events, public receiveProvider:ReceiveProvider) {

    }

    ionViewDidLoad(){
        this.events.subscribe('closeReceiveScreen', () => {
            this.navCtrl.pop();
        });
    }

    ionViewWillUnload(){
        this.events.unsubscribe('closeReceiveScreen');
    }

}
