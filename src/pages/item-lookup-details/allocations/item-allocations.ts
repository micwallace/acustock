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
import { UtilsProvider } from "../../../providers/core/utils";

@IonicPage()
@Component({
    selector: 'page-item-allocations',
    templateUrl: 'item-allocations.html',
})
export class ItemAllocationsPage {

    item:any = {};

    detailsCollapsed = false;

    constructor(public navCtrl:NavController, public navParams:NavParams, public util:UtilsProvider) {
        this.item = navParams.get("data");

        //console.log(JSON.stringify(this.item));
    }

    toggleCollapsed(){
        this.detailsCollapsed = !this.detailsCollapsed;
    }

    getShownAllocations(){
        var shown = ['SOBooked', 'SOBackOrdered', 'SOPrepared', 'SOAllocated', 'SOShipped', 'INIssues'];

        var allocs = [];

        for (let field of shown){
            allocs.push({
                field: field,
                value: this.item.Allocations.hasOwnProperty(field) ? this.item.Allocations[field].value : 0,
                included: this.item.Allocations.hasOwnProperty("InclQty" + field) ? this.item.Allocations["InclQty" + field].value : false
            });
        }

        return allocs;
    }

    getCustomerName(alloc){
        return (alloc.AccountID.value ? alloc.AccountID.value + " (" + alloc.AccountName.value + ")" : "");
    }

}
