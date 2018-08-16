import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { PickProvider } from '../../../providers/providers';
import { AlertController } from "ionic-angular/index";

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

    constructor(public navCtrl:NavController,
                public navParams:NavParams,
                public pickProvider:PickProvider,
                public alertCtrl:AlertController) {

    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad PickShipmentPickPage Tab: Pick List');
    }

    editPickItem(item) {
        let alert = this.alertCtrl.create({
            title: 'Update Quantity',
            inputs: [
                {
                    name: 'qty',
                    placeholder: 'Quantity',
                    value: item.PendingQty
                }
            ],
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    handler: data => {
                    }
                },
                {
                    text: 'Ok',
                    handler: data => {
                        this.pickProvider.updatePick(item, data.qty);
                    }
                }
            ]
        });
        alert.present();
    }

    removePickItem(item) {
        let alert = this.alertCtrl.create({
            title: 'Remove Pick',
            message: 'Are you sure you want to remove this pick?',
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    handler: () => {
                    }
                },
                {
                    text: 'OK',
                    handler: () => {
                        this.pickProvider.removePick(item.LineNbr.value, item.id);
                    }
                }
            ]
        });
        alert.present();
    }

}
