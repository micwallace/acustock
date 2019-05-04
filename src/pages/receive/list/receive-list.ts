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
import { ReceivePopover } from "../receive-popover";
import { UtilsProvider } from "../../../providers/core/utils";

@IonicPage()
@Component({
    selector: 'receive-list',
    templateUrl: 'receive-list.html'
})
export class ReceiveListPage {

    public type = "";
    public receiveList = [];

    constructor(public popoverCtrl:PopoverController,
                public viewCtrl:ViewController,
                public navParams:NavParams,
                public util:UtilsProvider) {

        this.type = this.navParams.get('type');
        this.receiveList = this.navParams.get('list');
    }

    presentPopover(event) {
        let popover = this.popoverCtrl.create(ReceivePopover);
        popover.present({ev:event});
    }

    openReceipt(receipt){
        this.viewCtrl.dismiss({"referenceNbr" : this.getReferenceNumber(receipt)});
    }

    getType(){
        return this.type.charAt(0).toUpperCase() + this.type.substr(1);
    }

    getReferenceNumber(receipt){

        switch(this.type){

            case "purchase":
                return receipt.OrderNbr.value;

            case "transfer":
                return receipt.ShipmentNbr.value ? receipt.ShipmentNbr.value : receipt.ReferenceNbr.value;

            case "shipment":
                return receipt.ShipmentNbr.value;
        }

        return "";
    }

    getRemainingItemCount(receipt){

        switch(this.type){

            case "purchase":
                return receipt.OpenQty.value;

            case "transfer":
                return receipt.RemainingQty.value;

            case "shipment":
                return receipt.ShippedQuantity.value;
        }

        return 0;
    }

    getOrderNumbers(receipt){

        if (this.type !== "shipment" || !receipt.hasOwnProperty('Orders'))
            return "";

        return "- " + receipt.Orders.map((item)=>{
            return item.OrderNbr.value;
        }).join(", ");
    }

}
