import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { CountProvider } from '../../../../providers/app/count'

/**
 * Generated class for the PickShipmentsListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-count-enter',
    templateUrl: 'count-list.html'
})
export class CountEntryListTab {

    objectKeys:any = Object.keys;

    constructor(public navCtrl:NavController, public navParams:NavParams, public countProvider:CountProvider, public alertController:AlertController) {
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad PickShipmentPickPage Tab: Pick List');
    }

}
