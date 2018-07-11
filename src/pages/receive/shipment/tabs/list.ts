import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { ReceiveProvider } from '../../../../providers/receive/receive'

/**
 * Generated class for the PickShipmentsListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-bin-transfer',
    templateUrl: 'transfer-list.html'
})
export class ReceiveShipmentListTab {

    objectKeys:any = Object.keys;

    constructor(public navCtrl:NavController, public navParams:NavParams, public receiveProvider:ReceiveProvider, public alertController:AlertController) {
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad PickShipmentPickPage Tab: Pick List');
    }

}
