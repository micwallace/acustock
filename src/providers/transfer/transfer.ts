import { Injectable } from '@angular/core';
import { Api } from '../../providers/api/api'
import { CacheProvider } from '../../providers/cache/cache'
import { LoadingController } from 'ionic-angular';
import { PreferencesProvider } from "../preferences/preferences";

/*
 Generated class for the PickProvider provider.

 See https://angular.io/guide/dependency-injection for more info on providers
 and Angular DI.
 */
@Injectable()
export class TransferProvider {

    public pendingItems = {};
    public pendingQty = 0;

    public transferHistory = [];

    constructor(public api:Api, public cache:CacheProvider, public loadingCtrl:LoadingController, public prefs:PreferencesProvider) {
        console.log('Hello TransferProvider Provider');
        this.loadPending();
        this.loadHistory();
    }

    private loadPending() {
        var pending = JSON.parse(localStorage.getItem("unconfirmed_transfers"));
        if (pending) {
            this.pendingItems = pending;
            this.calcTotalPendingQty();
        }
    }

    private savePending() {
        localStorage.setItem("unconfirmed_transfers", JSON.stringify(this.pendingItems));
    }

    private loadHistory() {

        var history = JSON.parse(localStorage.getItem("transfer_history"));
        if (history)
            this.transferHistory = history;
    }

    private addHistory(transferObject) {
        this.transferHistory.unshift(transferObject);
        localStorage.setItem("transfer_history", JSON.stringify(this.transferHistory))
    }

    public calcTotalPendingQty() {
        this.pendingQty = 0;
        for (var i in this.pendingItems) {
            for (var x in this.pendingItems[i].Items) {
                if (this.pendingItems[i].Items[x].Qty)
                    this.pendingQty += this.pendingItems[i].Items[x].Qty.value;
            }
        }
        return this.pendingQty;
    }

    public getItemLocPendingQty(location, item) {
        var total = 0;
        for (var i in this.pendingItems) {
            if (i.split("#")[0] == location) {
                for (var x in this.pendingItems[i].Items) {
                    if (this.pendingItems[i].Items[x].InventoryID.value == item)
                        total += this.pendingItems[i].Items[x].Qty.value;
                }
            }
        }
        return total;
    }

    public addPendingItem(location, toLocation, itemId, qty, srcQty) {
        var key = location + "#" + toLocation; // Hopefully no one will ever use hash in their location names

        if (!this.pendingItems.hasOwnProperty(key)) {
            this.pendingItems[key] = {
                Location: {value: location},
                ToLocation: {value: toLocation},
                srcQty: srcQty,
                Items: {}
            }
        }

        if (!this.pendingItems[key].Items.hasOwnProperty(itemId)) {
            this.pendingItems[key].Items[itemId] = {
                InventoryID: {value: itemId},
                Qty: {value: qty}
            }
        } else {
            this.pendingItems[key].Items[itemId].Qty.value += qty;
        }

        this.pendingQty += qty;

        this.savePending();
    }

    public removePendingItem(locationKey, itemKey) {

        if (this.pendingItems.hasOwnProperty(locationKey) && this.pendingItems[locationKey].Items.hasOwnProperty(itemKey)) {
            delete this.pendingItems[locationKey].Items[itemKey];
            if (Object.keys(this.pendingItems[locationKey].Items).length == 0)
                delete this.pendingItems[locationKey];
            this.calcTotalPendingQty();
            this.savePending();
        }
    }


    public getPendingItem(locationKey) {
        return this.pendingItems[locationKey];
    }

    public updatePendingItemQty(locationKey, itemKey, qty) {

        if (qty <= 0)
            this.removePendingItem(locationKey, itemKey);

        if (this.pendingItems.hasOwnProperty(locationKey) && this.pendingItems[locationKey].Items.hasOwnProperty(itemKey)) {

            this.pendingItems[locationKey].Items[itemKey].Qty.value = qty;
            this.calcTotalPendingQty();
            this.savePending();
        }

        return false;
    }

    public commitTransfer(loadingCtrl:any) {

        return new Promise((resolve, reject) => {

            var warehouse = this.prefs.getPreference('warehouse');

            var transfer = {
                TransferType: {value: "1-Step"},
                WarehouseID: {value: warehouse},
                ToWarehouseID: {value: warehouse},
                Hold: {value: false},
                Description: {value: "AcuShip Location Transfer"},
                Details: []
            };

            for (var i in this.pendingItems) {

                if (!this.pendingItems.hasOwnProperty(i)) continue;

                for (var x in this.pendingItems[i].Items) {

                    if (!this.pendingItems[i].Items.hasOwnProperty(x)) continue;

                    var line = {
                        InventoryID: this.pendingItems[i].Items[x].InventoryID,
                        LocationID: this.pendingItems[i].Location,
                        ToLocationID: this.pendingItems[i].ToLocation,
                        Quantity: this.pendingItems[i].Items[x].Qty
                    };

                    transfer.Details.push(line);
                }

            }

            this.api.putTransfer(transfer).then((res:any)=> {

                var transferId = res.ReferenceNbr.value;

                loadingCtrl.data.content = "Releasing Transfers...";

                this.api.releaseTransfer(transferId).then((releaseRes:any)=> {

                    // flush pending items
                    this.pendingItems = {};
                    this.pendingQty = 0;
                    this.savePending();

                    // add tranfer to history
                    this.addHistory(res);

                    resolve();

                }).catch((err)=> {

                    loadingCtrl.data.content = "Failed to release, reverting changes...";

                    this.api.deleteTransfer(transferId).then((deleteRes:any)=> {
                        err.message = "Failed to release transfer. " + err.message;
                        reject(err);
                    }).catch((derror)=> {
                        err.message = "Failed to release transfer and revert changes. Please delete transfer #" + transferId + " manually." + err.message + derror.message;
                        reject(err);
                    });

                });

            }).catch((err)=> {
                err.message = "Failed to submit transfer. " + err.message;
                reject(err);
            });

        });
    }
}
