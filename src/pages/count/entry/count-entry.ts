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
import { IonicPage, Tabs } from 'ionic-angular';
import { CountEntryEnterTab } from "./tabs/count-enter";
import { CountEntryListTab } from "./tabs/count-list";
import { CountEntryPendingTab } from "./tabs/pending-list";
import { CountProvider } from "../../../providers/app/count";

/**
 * Generated class for the PickShipmentsPickPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-count-entry',
    templateUrl: 'count-entry.html',
})
export class CountEntryPage {

    @ViewChild("tabs") tabs: Tabs;

    tab1Root = CountEntryEnterTab;
    tab2Root = CountEntryPendingTab;
    tab3Root = CountEntryListTab;

    constructor(public countProvider:CountProvider) {

        /*events.subscribe('closeCountScreen', () => {
            this.navCtrl.pop();
        });*/
    }

}
