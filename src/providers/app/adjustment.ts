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

import { Injectable } from '@angular/core';
import { Api } from '../core/api'
import { PreferencesProvider } from "../core/preferences";

/*
 Generated class for the PickProvider provider.

 See https://angular.io/guide/dependency-injection for more info on providers
 and Angular DI.
 */
@Injectable()
export class AdjustmentProvider {

    public pendingItems = {};

    public pendingNumItems = 0;
    public pendingVariance = 0;

    private lastRequest:any = "";

    constructor(public api:Api, public prefs:PreferencesProvider) {
        this.loadPending();
    }

    private loadPending() {
        var pending = JSON.parse(localStorage.getItem("unconfirmed_adjustments"));
        if (pending) {
            this.pendingItems = pending;
            this.calcTotalQuantities();
        }
    }

    private savePending() {
        localStorage.setItem("unconfirmed_adjustments", JSON.stringify(this.pendingItems));
    }

    public calcTotalQuantities() {
        this.pendingVariance = 0;
        this.pendingNumItems = 0;

        for (var i in this.pendingItems) {
            this.pendingVariance += this.pendingItems[i].Qty;
            this.pendingNumItems++;
        }
    }

    public getItemPendingPhysicalQty(item, location) {

        var key = item + "#" + location;

        if (!this.pendingItems.hasOwnProperty(key))
            return 0;


        return this.pendingItems[key].PhysicalQty;
    }

    public addPendingItem(location, itemId, qty, bookQty) {

        qty = parseFloat(qty);

        var key = itemId + "#" + location; // Hopefully no one will ever use hash in their location names

        this.pendingItems[key] = {
            LocationID: location,
            InventoryID: itemId,
            PhysicalQty: qty,
            BookQty: bookQty,
            Qty: (qty - bookQty)
        };

        this.calcTotalQuantities();
        this.savePending();
    }

    public removePendingItem(location, itemId) {

        var key = itemId + "#" + location;

        if (this.pendingItems.hasOwnProperty(key)) {
            delete this.pendingItems[key];
            this.calcTotalQuantities();
            this.savePending();
        }
    }

    public updatePendingItemQty(location, itemId, qty) {

        var key = itemId + "#" + location;

        if (this.pendingItems.hasOwnProperty(key)) {

            var newVariance = qty - this.pendingItems[key].BookQty;

            if (newVariance == 0){
                delete this.pendingItems[key];
            } else {
                this.pendingItems[key].PhysicalQty = qty;
                this.pendingItems[key].Qty = newVariance;
            }

            this.calcTotalQuantities();
            this.savePending();
        }

        return false;
    }

    public clearPendingItems(){
        this.pendingItems = {};
        this.calcTotalQuantities();
        this.savePending();
    }

    // Remove adjustments for which the book quantities have changed - this is to prevent stale adjustments from being commited.
    public validateBookQtys(){

        return new Promise((resolve, reject) => {
            // get all locations
            var locations = [];

            for (var i in this.pendingItems) {

                if (!this.pendingItems.hasOwnProperty(i)) continue;

                if (locations.indexOf(this.pendingItems[i].LocationID) === -1)
                    locations.push(this.pendingItems[i].LocationID);
            }

            this.loadOnHandQtys(locations).then((bookQtys)=>{

                var removed = [];

                for (var i in this.pendingItems) {

                    var item = this.pendingItems[i];

                    if (bookQtys.hasOwnProperty(item.LocationID) &&
                        bookQtys[item.LocationID].hasOwnProperty(item.InventoryID)){

                        var bookQty = bookQtys[item.LocationID][item.InventoryID];

                        if (bookQty != item.BookQty){

                            console.log("Book qty different, removing: "+bookQty);

                            removed.push(this.pendingItems[i]);

                            delete this.pendingItems[i];
                        }

                    }
                }

                this.savePending();
                this.calcTotalQuantities();

                resolve(removed);

            }).catch((err)=>{
                reject(err);
            });
        });
    }

    public loadOnHandQtys(locations){
        return new Promise((resolve, reject) => {
            this.recurseLoadOnHandQtys(resolve, reject, locations);
        });
    }

    public recurseLoadOnHandQtys(resolve, reject, locations, index=0, availability={}){

        this.api.getLocationContents(locations[index], this.prefs.getPreference('warehouse')).then((res) => {

            availability[locations[index]] = {};

            for (var i in res){
                if (!res.hasOwnProperty(i))
                    continue;

                let shelfQty = res[i].QtyOnHand.value;
                shelfQty -= res[i].QtySOShipped.value ? res[i].QtySOShipped.value : 0;
                availability[locations[index]][res[i].InventoryID.value] = shelfQty;
            }

            index++;

            if (index < locations.length){
                this.recurseLoadOnHandQtys(resolve, reject, locations, index, res);
            } else {
                resolve(availability);
            }

        }).catch((err)=>{
            reject(err);
        });
    }

    public commitAdjustment(loadingCtrl:any, description:string) {

        return new Promise((resolve, reject) => {

            var warehouse = this.prefs.getPreference('warehouse');

            var adjustment = {
                Hold: {value: false},
                Description: {value: "AcuStock Adjustment (device: "+this.prefs.getPreference('device')+")" + (description!="" ? " - "+description : "")},
                Details: []
            };

            for (var i in this.pendingItems) {

                if (!this.pendingItems.hasOwnProperty(i)) continue;

                var line = {
                    InventoryID: {value: this.pendingItems[i].InventoryID},
                    WarehouseID: {value: warehouse},
                    LocationID: {value: this.pendingItems[i].LocationID},
                    Quantity: {value: this.pendingItems[i].Qty}
                };

                adjustment.Details.push(line);
            }

            //console.log(JSON.stringify(adjustment));
            this.lastRequest = adjustment;

            this.api.putAdjustment(adjustment).then((res:any)=> {

                if (!this.prefs.getPreference("release_adjustments"))
                    return resolve(res);

                var AdjustmentId = res.ReferenceNbr.value;

                loadingCtrl.data.content = "Releasing Adjustments...";

                this.api.releaseAdjustment(AdjustmentId).then((releaseRes:any)=> {

                    // flush pending items
                    this.pendingItems = {};
                    this.pendingNumItems = 0;
                    this.pendingVariance = 0;
                    this.savePending();

                    res.released = true;

                    resolve(res);

                }).catch((err)=> {

                    loadingCtrl.data.content = "Failed to release, reverting changes...";

                    this.api.deleteAdjustment(AdjustmentId).then((deleteRes:any)=> {
                        err.message = "Failed to release Adjustment. " + err.message;
                        reject(err);
                    }).catch((derror)=> {
                        err.message = "Failed to release Adjustment and revert changes. Please delete Adjustment #" + AdjustmentId + " manually." + err.message + derror.message;
                        reject(err);
                    });

                });

            }).catch((err)=> {
                err.message = "Failed to submit Adjustment. " + err.message;
                reject(err);
            });

        });
    }

    public getErrorReportingData(){
        return {provider: "adjustment", pendingItems: this.pendingItems, lastRequest: this.lastRequest};
    }
}
