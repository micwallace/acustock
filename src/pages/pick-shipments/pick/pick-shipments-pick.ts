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
import { IonicPage, NavController, Events } from 'ionic-angular';
import { PickTab } from "./tabs/pick";
import { PickListTab } from "./tabs/pick-list";
import { UnpickedListTab } from "./tabs/unpicked-list";
import { PickProvider } from "../../../providers/app/pick";

/**
 * Generated class for the PickShipmentsPickPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-pick-shipments-pick',
    templateUrl: 'pick-shipments-pick.html',
})
export class PickShipmentsPickPage {

    tab1Root = PickTab;
    tab2Root = UnpickedListTab;
    tab3Root = PickListTab;

    constructor(public navCtrl:NavController,
                public events:Events,
                public pickProvider:PickProvider) {

    }

    ionViewDidEnter(){
        console.log("PickShipmentsPickPage Enter");
        this.events.subscribe('closeModal', () => {
            this.navCtrl.pop();
        });
    }

    ionViewWillLeave(){
        console.log("PickShipmentsPickPage Leave");
        this.events.unsubscribe('closeModal');
    }

}
