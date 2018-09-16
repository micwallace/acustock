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
import { IonicPage, NavController, NavParams, LoadingController, ModalController } from 'ionic-angular';
import { Api, CacheProvider, ItemAutocompleteService, PreferencesProvider } from '../../providers/providers';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { ItemLookupDetailsPage } from '../item-lookup-details/item-lookup-details';
import {UtilsProvider} from "../../providers/core/utils";

/**
 * Generated class for the ItemLookupPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-item-lookup',
    templateUrl: 'item-lookup.html',
    providers: [ItemAutocompleteService]
})
export class ItemLookupPage {

    itemLocations = [];

    loader = null;

    selectedItem = null;

    constructor(public navCtrl:NavController,
                public navParams:NavParams,
                public itemAutocompleteService:ItemAutocompleteService,
                public api:Api,
                public loadingCtrl:LoadingController,
                public modalCtrl:ModalController,
                public barcodeScanner:BarcodeScanner,
                public cache:CacheProvider,
                public prefs:PreferencesProvider,
                public utils:UtilsProvider) {
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad ItemLookupPage');
    }

    loadItemLocations(item, isScan=false) {
        //console.log(JSON.stringify(item));
        if (this.loader == null) {
            this.loader = this.loadingCtrl.create({content: "Loading..."});
            this.loader.present();
        }

        this.api.getItemWarehouseLocations(item.InventoryID.value, this.prefs.getPreference('warehouse')).then((res:any) => {
            this.itemLocations = res;
            console.log(JSON.stringify(res));
            this.dismissLoader();

        }).catch((err) => {

            //console.log(JSON.stringify(err));
            this.utils.playFailedSound(isScan);
            this.dismissLoader().then(()=> {
                this.utils.processApiError("Error", err.message, err, this.navCtrl);
            }).catch((err)=>{
                this.utils.processApiError("Error", err.message, err, this.navCtrl);
            });
        });
    }

    public scanBarcode() {
        this.barcodeScanner.scan().then((barcodeData) => {
            if (barcodeData.cancelled)
                return;

            //this.searchbar.setValue(barcodeData.text);

            this.loadItemByBarcode(barcodeData.text);

        }, (err) => {
            // An error occurred
            this.utils.showAlert("Error", "Error accessing barcode device: " + err);
        });
    }

    onBarcodeScan(barcodeText) {
        console.log(barcodeText);

        //this.searchbar.setValue(barcodeText);

        this.loadItemByBarcode(barcodeText);
    }

    loadItemByBarcode(barcodeText) {

        this.loader = this.loadingCtrl.create({content: "Loading..."});
        this.loader.present();

        this.cache.getItemById(barcodeText).then((item:any) => {

            this.selectedItem = item;
            this.loadItemLocations(item);
            this.dismissLoader();

        }).catch((err) => {

            this.utils.playFailedSound(true);
            this.dismissLoader().then(()=> {
                this.utils.showAlert("Error", err.message, {exception: err});
            }).catch((err)=>{
                this.utils.showAlert("Error", err.message, {exception: err});
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
                reject(err);
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

