import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, Events, Tabs } from 'ionic-angular';
import { AdjustmentEnterTab } from "./tabs/adjustment-enter";
import { AdjustmentListTab } from "./tabs/adjustment-list";
import { AdjustmentProvider } from "../../providers/app/adjustment";

/**
 * Generated class for the PickShipmentsPickPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-adjustment',
    templateUrl: 'adjustment.html',
})
export class AdjustmentPage {

    @ViewChild("tabs") tabs: Tabs;

    tab1Root = AdjustmentEnterTab;
    tab2Root = AdjustmentListTab;

    constructor(public navCtrl:NavController,
                public navParams:NavParams,
                public viewCtrl:ViewController,
                public events:Events,
                public transferProvider:AdjustmentProvider) {

    }

    onBarcodeScan(barcodeText){

        if (this.tabs.selectedIndex !== 0) {
            this.tabs.select(0, {});
        }

        this.events.publish('barcode:scan', barcodeText);
    }

}
