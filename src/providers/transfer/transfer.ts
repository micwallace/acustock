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

    public transferHistory = [];

    constructor(public api:Api, public cache:CacheProvider, public loadingCtrl:LoadingController, public prefs: PreferencesProvider) {
        console.log('Hello TransferProvider Provider');
    }

    private loadHistory(){

    }

    private addHistory(transferObject){

    }

    public addPendingItem(location, toLocation, itemId, qty){
        var key = location + "#" + toLocation; // Hopefully no one will ever use hash in their location names

        if (!this.pendingItems.hasOwnProperty(key)){
            this.pendingItems[key] = {
                Location: {value: location},
                ToLocation: {value: toLocation},
                Items: {}
            }
        }

        if (!this.pendingItems[key].Items.hasOwnProperty(itemId)){
            this.pendingItems[key].Items[itemId] = {
                InventoryID: {value: itemId},
                Qty: {value: qty}
            }
        } else {
            this.pendingItems[key].Items[itemId].Qty.value += qty;
        }
    }

    public commitTransfer(){

    }
}
