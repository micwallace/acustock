import { Component } from '@angular/core';
import 'rxjs/add/operator/map'
import { IonicPage, NavController, NavParams, LoadingController } from 'ionic-angular';
import { Api, LocationAutocompleteService } from '../../providers/providers';

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

    constructor(public navCtrl:NavController, public navParams:NavParams, public binAutocompleteService:LocationAutocompleteService, public api:Api, public loadingCtrl:LoadingController) {
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad BinLookupPage');
    }

    loadBinContents(item) {
        //console.log(JSON.stringify(selected));
        //console.log(JSON.stringify(item));
        let loader = this.loadingCtrl.create({content: "Loading..."});
        loader.present();

        this.api.getLocationContents(item.LocationID.value).then((res:any) => {
            this.binContents = res;
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

