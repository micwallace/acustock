import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

/**
 * Generated class for the ItemLookupDetailsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-item-lookup-details',
    templateUrl: 'item-lookup-details.html',
})
export class ItemLookupDetailsPage {

    data = {};

    constructor(public navCtrl:NavController, public navParams:NavParams) {
        this.data = navParams.get("data");

        console.log(JSON.stringify(this.data));
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad ItemLookupDetailsPage');
    }

}
