import { Component, ViewChild, NgZone } from '@angular/core';
import 'rxjs/add/operator/map'
import { IonicPage, NavController, NavParams, LoadingController, List } from 'ionic-angular';
import { Api, ItemAutocompleteService } from '../../providers/providers';

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

    @ViewChild(List) list:List;

    itemLocations = [];

    constructor(public navCtrl:NavController,
                public navParams:NavParams,
                public itemAutocompleteService:ItemAutocompleteService,
                public api:Api,
                public loadingCtrl:LoadingController,
                public zone:NgZone) {
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad ItemLookupPage');
    }

    loadItemLocations(item) {
        //console.log(JSON.stringify(item));
        let loader = this.loadingCtrl.create({content: "Loading..."});
        loader.present();

        this.api.getItemWarehouseLocations(item.InventoryID.value).then((res:any) => {
            this.itemLocations = res;
            console.log(JSON.stringify(res));
            loader.dismiss();

        }).catch((err) => {
            console.log(JSON.stringify(err));
            loader.dismiss();
        });
    }

    public scanBarcode(){

    }

}

