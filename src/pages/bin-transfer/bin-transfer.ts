import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, Events } from 'ionic-angular';
import { EnterTab } from "./tabs/enter";
import { TransferListTab } from "./tabs/transfer-list";
import { TransferHistoryTab } from "./tabs/transfer-history";
import { TransferProvider } from "../../providers/transfer/transfer";

/**
 * Generated class for the PickShipmentsPickPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-bin-transfer',
    templateUrl: 'bin-transfer.html',
})
export class BinTransferPage {

    tab1Root = EnterTab;
    tab2Root = TransferListTab;
    tab3Root = TransferHistoryTab;

    constructor(public navCtrl:NavController,
                public navParams:NavParams,
                public viewCtrl:ViewController,
                public events:Events,
                public transferProvider:TransferProvider) {

    }

}
