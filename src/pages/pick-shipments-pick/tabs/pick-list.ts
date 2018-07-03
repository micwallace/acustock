import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { PickProvider } from '../../../providers/providers';

/**
 * Generated class for the PickShipmentsListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'tabs-pick-list',
  templateUrl: 'pick-list.html'
})
export class PickListTab {

  objectKeys:any = Object.keys;

  constructor(public navCtrl: NavController, public navParams: NavParams, public pickProvider: PickProvider) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad PickShipmentPickPage Tab: Pick List');
  }

  openPickItem(item){

  }

}
