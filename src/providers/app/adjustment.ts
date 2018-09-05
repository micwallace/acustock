import { Injectable } from '@angular/core';
import { Api } from '../core/api'
import { CacheProvider } from '../core/cache'
import { LoadingController } from 'ionic-angular';
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

    //public AdjustmentHistory = [];

    constructor(public api:Api, public cache:CacheProvider, public loadingCtrl:LoadingController, public prefs:PreferencesProvider) {
        console.log('Hello AdjustmentProvider Provider');
        this.loadPending();
        //this.loadHistory();
    }

    private loadPending() {
        var pending = JSON.parse(localStorage.getItem("unconfirmed_adjustments"));
        if (pending) {
            // TODO: recalc current quantity
            this.pendingItems = pending;
            this.calcTotalQuantities();
        }
    }

    private savePending() {
        localStorage.setItem("unconfirmed_adjustments", JSON.stringify(this.pendingItems));
    }

    /*private loadHistory() {

        var history = JSON.parse(localStorage.getItem("adjustment_history"));
        if (history)
            this.adjustmentHistory = history;
    }

    private addHistory(adjustmentObject) {
        this.adjustmentHistory.unshift(adjustmentObject);
        localStorage.setItem("adjustment_history", JSON.stringify(this.adjustmentHistory))
    }*/

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

            var newVariance = qty -  this.pendingItems[key].BookQty;

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

    public commitAdjustment(loadingCtrl:any) {

        return new Promise((resolve, reject) => {

            var warehouse = this.prefs.getPreference('warehouse');

            var adjustment = {
                Hold: {value: false},
                Description: {value: "AcuStock Adjustment"},
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

            console.log(JSON.stringify(adjustment));

            this.api.putAdjustment(adjustment).then((res:any)=> {

                var AdjustmentId = res.ReferenceNbr.value;

                loadingCtrl.data.content = "Releasing Adjustments...";

                this.api.releaseAdjustment(AdjustmentId).then((releaseRes:any)=> {

                    // flush pending items
                    this.pendingItems = {};
                    this.pendingVariance = 0;
                    this.savePending();

                    // add tranfer to history
                    //this.addHistory(res);

                    resolve();

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
}
