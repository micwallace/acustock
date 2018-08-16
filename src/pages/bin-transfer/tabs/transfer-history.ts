import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { TransferProvider } from '../../../providers/transfer/transfer'

/**
 * Generated class for the PickShipmentsListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-bin-transfer',
    templateUrl: 'transfer-history.html'
})
export class TransferHistoryTab {

    constructor(public navCtrl:NavController,
                public navParams:NavParams,
                public transferProvider:TransferProvider) {

    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad PickShipmentPickPage Tab: Unpicked List');
    }

    openPickItem(item) {

    }

}
