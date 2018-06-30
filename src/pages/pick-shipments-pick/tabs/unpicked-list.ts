import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
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

  constructor(public navCtrl: NavController, public navParams: NavParams, public pickProvider: PickProvider) {
    //console.log(JSON.stringify(pickProvider.unpickedItems));
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad PickShipmentPickPage Tab: Unpicked List');
  }

  openPickItem(item){

  }

}
