import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, Events } from 'ionic-angular';
import { ReceiveShipmentEnterTab } from "./tabs/shipment-enter";
import { ReceiveShipmentListTab } from "./tabs/list";
import { ReceiveProvider } from "../../../providers/receive/receive";

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
export class ReceiveShipmentPage {

    tab1Root = ReceiveShipmentEnterTab;
    tab2Root = ReceiveShipmentListTab;

    constructor(public navCtrl:NavController, public navParams:NavParams, public viewCtrl:ViewController, public events:Events, public receiveProvider:ReceiveProvider) {

    }

}
