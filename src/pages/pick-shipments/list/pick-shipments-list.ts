import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController  } from 'ionic-angular';
import { PickProvider } from '../../../providers/providers';

/**
 * Generated class for the PickShipmentsListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-pick-shipments-list',
    templateUrl: 'pick-shipments-list.html'
})
export class PickShipmentsListPage {

    constructor(public pickProvider:PickProvider) {
        console.log("Page opened");
        console.log(JSON.stringify(this.pickProvider.currentShipment));
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad PickShipmentsListPage');
    }

}
