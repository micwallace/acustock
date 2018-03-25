import { Component } from '@angular/core';
import 'rxjs/add/operator/map'
import { IonicPage, NavController, NavParams, LoadingController, ModalController } from 'ionic-angular';
import { Api, CacheProvider, ItemAutocompleteService } from '../../providers/providers';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { ItemLookupDetailsPage } from '../item-lookup-details/item-lookup-details';

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
                public modalCtrl: ModalController,
                public barcodeScanner: BarcodeScanner,
                public cache: CacheProvider) {
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad ItemLookupPage');
    }

    loadItemLocations(item) {
        //console.log(JSON.stringify(item));
        if (this.loader == null) {
            this.loader = this.loadingCtrl.create({content: "Loading..."});
            this.loader.present();
        }

        this.api.getItemWarehouseLocations(item.InventoryID.value).then((res:any) => {
            this.itemLocations = res;
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

            //this.searchbar.setValue(barcodeData.text);

            this.loadItemByBarcode(barcodeData.text);

        }, (err) => {
            // An error occurred
            alert("Error accessing barcode device: " + err);
        });
    }

    onBarcodeScan(barcodeText){
        console.log(barcodeText);

        //this.searchbar.setValue(barcodeText);

        this.loadItemByBarcode(barcodeText);
    }

    loadItemByBarcode(barcodeText){

        this.loader = this.loadingCtrl.create({content: "Loading..."});
        this.loader.present();

        this.cache.getItemList().then((itemList: any) => {

            for (var i=0; i<itemList.length; i++){

                if (itemList[i].InventoryID.value == barcodeText){

                    this.selectedItem = itemList[i];

                    this.loadItemLocations(itemList[i]);

                    return;
                }


                for (var x=0; x<itemList[i].CrossReferences.length; x++){

                    if (itemList[i].CrossReferences[x].AlternateID.value == barcodeText){

                        this.selectedItem = itemList[i];

                        this.loadItemLocations(itemList[i]);

                        return;
                    }

                }
            }

            this.dismissLoader();
            alert("The item with ID " + barcodeText + " was not found.");

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

        this.api.getItemBatches(item.InventoryID.value, item.WarehouseID.value, item.LocationID.value).then((res) => {

            item.LotSerialDetails = res;

            let modal = this.modalCtrl.create(ItemLookupDetailsPage, {data: item});
            modal.present();
            loader.dismiss();

        }).catch((err) => {

            loader.dismiss();
            alert(err.error);
        });

    }

}

