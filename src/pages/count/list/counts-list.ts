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
import { IonicPage, PopoverController, ViewController, NavParams } from 'ionic-angular';
import { CountPopover } from "../count-popover";
import { UtilsProvider } from "../../../providers/core/utils";

@IonicPage()
@Component({
    selector: 'counts-list',
    templateUrl: 'counts-list.html'
})
export class CountsListPage {

    public countList = [];

    constructor(public popoverCtrl:PopoverController,
                public viewCtrl:ViewController,
                public navParams:NavParams,
                public util:UtilsProvider) {

        this.countList = this.navParams.get('list');
    }

    presentPopover(event) {
        let popover = this.popoverCtrl.create(CountPopover);
        popover.present({ev:event});
    }

    openCount(referenceNbr){
        this.viewCtrl.dismiss({"referenceNbr" : referenceNbr});
    }

}
