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
                this.utils.processApiError("Error", err.message, {exception: err}, this.navCtrl);
            }).catch((err)=>{
                this.utils.processApiError("Error", err.message, {exception: err}, this.navCtrl);
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

        this.api.getItemBatches(item.InventoryID.value, item.Warehouse.value, item.Location.value).then((res) => {

            item.LotSerialDetails = res;

            let modal = this.modalCtrl.create(ItemLookupDetailsPage, {data: item});
            modal.present();
            loader.dismiss();

        }).catch((err) => {

            loader.dismiss().then(()=> {
                this.utils.processApiError("Error", err.message, {exception: err}, this.navCtrl);
            });
        });

    }

}

