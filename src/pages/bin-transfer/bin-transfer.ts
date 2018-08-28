import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, Events, Tabs } from 'ionic-angular';
import { EnterTab } from "./tabs/enter";
import { TransferListTab } from "./tabs/transfer-list";
import { TransferHistoryTab } from "./tabs/transfer-history";
import { TransferProvider } from "../../providers/app/transfer";

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

    @ViewChild("tabs") tabs: Tabs;

    tab1Root = EnterTab;
    tab2Root = TransferListTab;
    tab3Root = TransferHistoryTab;

    constructor(public navCtrl:NavController,
                public navParams:NavParams,
                public viewCtrl:ViewController,
                public events:Events,
                public transferProvider:TransferProvider) {

    }

    onBarcodeScan(barcodeText){

        if (this.tabs.selectedIndex !== 0) {
            this.tabs.select(0, {});
        }

        this.events.publish('barcode:scan', barcodeText);
    }

}
