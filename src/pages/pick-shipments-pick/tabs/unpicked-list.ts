import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
import { PickProvider } from '../../../providers/pick/pick'

/**
 * Generated class for the PickShipmentsListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'tabs-unpicked-list',
    templateUrl: 'unpicked-list.html'
})
export class UnpickedListTab {

    constructor(public navCtrl:NavController,
                public navParams:NavParams,
                public pickProvider:PickProvider,
                public events:Events) {

    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad PickShipmentPickPage Tab: Unpicked List');
    }

    openPickItem(item) {

    }

    confirmPicks(){
        this.events.publish('picks:confirm');
    }

    cancelPicks(){
        this.events.publish('picks:cancel');
    }

}
