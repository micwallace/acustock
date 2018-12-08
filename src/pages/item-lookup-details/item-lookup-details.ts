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
import { IonicPage, NavController, NavParams, LoadingController } from 'ionic-angular';
import { Api } from "../../providers/core/api";
import { UtilsProvider } from "../../providers/core/utils";
import { ItemSerialsPage } from "./serials/item-serials";
import {ItemAllocationsPage} from "./allocations/item-allocations";

@IonicPage()
@Component({
    selector: 'page-item-lookup-details',
    templateUrl: 'item-lookup-details.html',
})
export class ItemLookupDetailsPage {

    item:any = {};

    detailsCollapsed = false;

    constructor(public navCtrl:NavController,
                public navParams:NavParams,
                public api:Api,
                public utils:UtilsProvider,
                public loadingCtrl:LoadingController) {

        this.item = navParams.get("data");

        //console.log(JSON.stringify(this.data));
    }

    toggleCollapsed(){
        this.detailsCollapsed = !this.detailsCollapsed;
    }

    viewAllocations(){

        // Use already loaded data if available
        if (this.item.Allocations != null){
            //noinspection TypeScriptValidateTypes
            this.navCtrl.push(ItemAllocationsPage, {data: this.item});
            return;
        }

        var loader = this.loadingCtrl.create({content: "Loading..."});
        loader.present();

        this.api.getItemAllocationInfo(this.item.InventoryID.value, this.item.Warehouse.value, this.item.Location.value).then((res) => {

            this.item.Allocations = res;

            loader.dismissAll();
            //noinspection TypeScriptValidateTypes
            this.navCtrl.push(ItemAllocationsPage, {data: this.item});

        }).catch((err) => {

            loader.dismiss().then(()=> {
                this.utils.processApiError("Error", err.message, err, this.navCtrl);
            });
        });
    }

    viewHistory(){

    }

    viewSerialLots(){

        // Use already loaded data if available
        if (this.item.LotSerialDetails != null){
            //noinspection TypeScriptValidateTypes
            this.navCtrl.push(ItemSerialsPage, {data: this.item});
            return;
        }

        var loader = this.loadingCtrl.create({content: "Loading..."});
        loader.present();

        this.api.getItemLotSerialInfo(this.item.InventoryID.value, this.item.Warehouse.value, this.item.Location.value).then((res) => {

            this.item.LotSerialDetails = res;

            loader.dismissAll();
            //noinspection TypeScriptValidateTypes
            this.navCtrl.push(ItemSerialsPage, {data: this.item});

        }).catch((err) => {

            loader.dismiss().then(()=> {
                this.utils.processApiError("Error", err.message, err, this.navCtrl);
            });
        });
    }

}
