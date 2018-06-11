import { Component } from '@angular/core';
import 'rxjs/add/operator/map'
import { IonicPage, NavController, NavParams, LoadingController, ModalController } from 'ionic-angular';
import { Api, CacheProvider, LocationAutocompleteService, PreferencesProvider } from '../../providers/providers';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { ItemLookupDetailsPage } from '../item-lookup-details/item-lookup-details'

/**
 * Generated class for the BinLookupPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

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
                public navParams:NavParams,
                public binAutocompleteService:LocationAutocompleteService,
                public api:Api,
                public loadingCtrl:LoadingController,
                public barcodeScanner: BarcodeScanner,
                public cache: CacheProvider,
                public modalCtrl: ModalController,
                public prefs: PreferencesProvider) {
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad BinLookupPage');
    }

    loadBinContents(item) {
        //console.log(JSON.stringify(selected));
        //console.log(JSON.stringify(item));
        if (this.loader == null) {
            this.loader = this.loadingCtrl.create({content: "Loading..."});
            this.loader.present();
        }

        this.api.getLocationContents(item.LocationID.value, this.prefs.getPreference('warehouse')).then((res:any) => {
            this.binContents = res;
            console.log(JSON.stringify(res));
            this.dismissLoader();

        }).catch((err) => {
            console.log(JSON.stringify(err));
            this.dismissLoader();
        });
    }

    public scanBarcode(){
        this.barcodeScanner.scan().then((barcodeData) => {
            if (barcodeData.cancelled)
                return;

            this.loadItemByBarcode(barcodeData.text);

        }, (err) => {
            // An error occurred
            alert("Error accessing barcode device: " + err);
        });
    }

    onBarcodeScan(barcodeText){
        console.log(barcodeText);

        this.loadItemByBarcode(barcodeText);
    }

    loadItemByBarcode(barcodeText){

        this.loader = this.loadingCtrl.create({content: "Loading..."});
        this.loader.present();

        this.cache.getBinById(barcodeText).then((bin: any) => {

            this.selectedLocation = bin;
            this.loadBinContents(bin);
            this.dismissLoader();

        }).catch((err) => {

            this.dismissLoader();
            alert(err.message);
        });
    }

    private dismissLoader(){
        this.loader.dismiss();
        this.loader = null;
    }

    openDetailsModal(event, item){

        let loader = this.loadingCtrl.create({content: "Loading..."});
        loader.present();

        this.api.getItemBatches(item.InventoryID.value, item.Warehouse.value, item.Location.value).then((res) => {

            item.LotSerialDetails = res;

            let modal = this.modalCtrl.create(ItemLookupDetailsPage, {data: item});
            modal.present();
            loader.dismiss();

        }).catch((err) => {

            loader.dismiss();
            alert(err.message);
        });

    }

}

