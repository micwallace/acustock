import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, Events, Tabs } from 'ionic-angular';
import { PickTab } from "./tabs/pick";
import { PickListTab } from "./tabs/pick-list";
import { UnpickedListTab } from "./tabs/unpicked-list";
import { PickProvider } from "../../providers/pick/pick";

/**
 * Generated class for the PickShipmentsPickPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-pick-shipments-pick',
    templateUrl: 'pick-shipments-pick.html',
})
export class PickShipmentsPickPage {

    @ViewChild("tabs") tabs: Tabs;

    tab1Root = PickTab;
    tab2Root = UnpickedListTab;
    tab3Root = PickListTab;

    constructor(public navCtrl:NavController,
                public navParams:NavParams,
                public viewCtrl:ViewController,
                public events:Events,
                public pickProvider:PickProvider) {

    }

    ionOnViewDidLoad(){
        this.events.subscribe('closeModal', () => {
            this.navCtrl.pop();
        });
    }

    ionOnViewDidUnload(){
        this.events.unsubscribe('closeModal');
    }

    onBarcodeScan(barcodeText){
        if (this.tabs.selectedIndex !== 0) {
            this.tabs.select(0, {});
        }

        this.events.publish('barcode:scan', barcodeText);
    }

}
