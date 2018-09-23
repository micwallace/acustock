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
import { IonicPage, Events, PopoverController } from 'ionic-angular';
import { CountProvider } from '../../../../providers/app/count'
import { CountPopover } from "../../count-popover";

@IonicPage()
@Component({
    selector: 'page-count-enter',
    templateUrl: 'count-list.html'
})
export class CountEntryListTab {

    objectKeys:any = Object.keys;

    constructor(public countProvider:CountProvider, public events:Events, public popoverCtrl:PopoverController) {

    }

    presentPopover(event) {
        let popover = this.popoverCtrl.create(CountPopover);
        popover.present({ev:event});
    }

    commitCounts(){
        this.events.publish('counts:commit');
    }

    clearCounts(){
        this.events.publish('counts:clear');
    }

}
