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
import 'rxjs/add/operator/map'
import { IonicPage, NavController, PopoverController, LoadingController, ModalController } from 'ionic-angular';
import { Api, CacheProvider, LocationAutocompleteService, PreferencesProvider } from '../../providers/providers';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { ItemLookupDetailsPage } from '../item-lookup-details/item-lookup-details'
import { UtilsProvider } from "../../providers/core/utils";
import { LookupsPopover } from "./lookups-popover";

@IonicPage()
@Component({
    selector: 'page-bin-lookup',
    templateUrl: 'bin-lookup.html',
    providers: [LocationAutocompleteService]
})
export class BinLookupPage {

    binContents = [];

    loader = null;

    selectedLocation = null;

    constructor(public navCtrl:NavController,
                public popoverCtrl:PopoverController,
                public binAutocompleteService:LocationAutocompleteService,
                public api:Api,
                public loadingCtrl:LoadingController,
                public barcodeScanner:BarcodeScanner,
                public cache:CacheProvider,
                public modalCtrl:ModalController,
                public prefs:PreferencesProvider,
                public utils:UtilsProvider) {
    }

    presentPopover(event) {
        let popover = this.popoverCtrl.create(LookupsPopover);
        popover.present({ev:event});
    }

    loadBinContents(item, isScan=false) {

        if (this.loader == null) {
            this.loader = this.loadingCtrl.create({content: "Loading..."});
            this.loader.present();
        }

        this.api.getLocationContents(item.LocationID.value, this.prefs.getPreference('warehouse')).then((res:any) => {

            this.binContents = res;
            this.dismissLoader();

        }).catch((err) => {

            this.utils.playFailedSound(isScan);
            this.dismissLoader().then(()=> {
                this.utils.processApiError("Error", err.message, err, this.navCtrl);
            });
        });
    }

    public scanBarcode() {

        this.barcodeScanner.scan().then((barcodeData) => {

            if (barcodeData.cancelled)
                return;

            this.loadItemByBarcode(barcodeData.text);

        }, (err) => {
            this.utils.playFailedSound(true);
            this.utils.showAlert("Error", "Error accessing barcode device: " + err, {exception: err});
        });
    }

    loadItemByBarcode(barcodeText) {

        this.loader = this.loadingCtrl.create({content: "Loading..."});
        this.loader.present();

        this.cache.getBinById(barcodeText).then((bin:any) => {

            this.selectedLocation = bin;
            this.loadBinContents(bin, true);

        }).catch((err) => {

            this.selectedLocation = null;
            this.utils.playFailedSound(true);
            this.dismissLoader().then(()=> {
                this.utils.processApiError("Error", err.message, err, this.navCtrl);
            });
        });
    }

    private dismissLoader() {
        return new Promise((resolve, reject)=>{

            if (this.loader == null)
                return resolve();

            this.loader.dismiss().then(()=>{
                this.loader = null;
                resolve();
            }).catch((err)=>{
                resolve(err); // always continue
            });
        });
    }

    openDetailsModal(event, item) {

        let loader = this.loadingCtrl.create({content: "Loading..."});
        loader.present();

        this.api.getItemLotSerialInfo(item.InventoryID.value, item.Warehouse.value, item.Location.value).then((res) => {

            item.LotSerialDetails = res;

            let modal = this.modalCtrl.create(ItemLookupDetailsPage, {data: item});
            modal.present();
            loader.dismiss();

        }).catch((err) => {

            loader.dismiss().then(()=> {
                this.utils.processApiError("Error", err.message, err, this.navCtrl);
            });
        });

    }

}

