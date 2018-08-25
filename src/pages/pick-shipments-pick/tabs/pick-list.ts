import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
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
                public alertCtrl:AlertController,
                public events:Events) {

    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad PickShipmentPickPage Tab: Pick List');
    }

    editPickItem(item) {
        let alertDialog = this.alertCtrl.create({
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

                        if (data.qty > this.pickProvider.getPendingItem(item.LineNbr.value).RemainingQty){
                            alert("The entered value exceed the required qty for this item.");
                        } else {
                            this.pickProvider.updatePick(item.LineNbr.value, item.id, data.qty);
                        }
                    }
                }
            ]
        });
        alertDialog.present();
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
                        this.pickProvider.updatePick(item.LineNbr.value, item.id, 0);
                    }
                }
            ]
        });
        alert.present();
    }

    confirmPicks(){
        this.events.publish('picks:confirm');
    }

    cancelPicks(){
        this.events.publish('picks:cancel');
    }

}
