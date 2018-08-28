import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, Events, Tabs } from 'ionic-angular';
import { CountEntryEnterTab } from "./tabs/count-enter";
import { CountEntryListTab } from "./tabs/count-list";
import { CountEntryPendingTab } from "./tabs/pending-list";
import { CountProvider } from "../../../providers/app/count";
import {UtilsProvider} from "../../../providers/core/utils";

/**
 * Generated class for the PickShipmentsPickPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-count-entry',
    templateUrl: 'count-entry.html',
})
export class CountEntryPage {

    @ViewChild("tabs") tabs: Tabs;

    tab1Root = CountEntryEnterTab;
    tab2Root = CountEntryPendingTab;
    tab3Root = CountEntryListTab;

    constructor(public navCtrl:NavController,
                public navParams:NavParams,
                public viewCtrl:ViewController,
                public events:Events,
                public countProvider:CountProvider,
                public utils:UtilsProvider) {

        /*events.subscribe('closeCountScreen', () => {
            this.navCtrl.pop();
        });*/
    }

    onBarcodeScan(barcodeText){
        if (this.tabs.selectedIndex !== 0) {
            this.tabs.select(0, {});
        }

        this.events.publish('barcode:scan', barcodeText);
    }

}
