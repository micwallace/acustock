import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { ReceiveProvider } from '../../../../providers/app/receive'
import { UtilsProvider } from "../../../../providers/core/utils";

/**
 * Generated class for the PickShipmentsListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-receive',
    templateUrl: 'pending.html'
})
export class ReceiveShipmentPendingTab {

    objectKeys:any = Object.keys;

    constructor(public navCtrl:NavController,
                public navParams:NavParams,
                public receiveProvider:ReceiveProvider,
                public alertCtrl:AlertController,
                public utils:UtilsProvider) {
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad PickShipmentPickPage Tab: Pick List');
    }

    editReceiptItem(line, key, item) {
        let alertDialog = this.alertCtrl.create({
            title: 'Update Quantity',
            inputs: [
                {
                    name: 'qty',
                    placeholder: 'Quantity',
                    value: item.Qty
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

                        if (data.qty <= 0)
                            return this.receiveProvider.removeReceiptItem(line, key);

                        var remQty = this.receiveProvider.getCommittedRemainingQty(line);

                        if (remQty < data.qty){
                            this.utils.showAlert("Error", "The entered quantity is " + data.qty + " but there is only " + remQty + " left to receive.");
                            return false;
                        }

                        this.receiveProvider.updateReceiptItem(line, key, data.qty);
                    }
                }
            ]
        });
        alertDialog.present();
    }

    removeReceiptItem(line, key) {
        let alert = this.alertCtrl.create({
            title: 'Remove Receipt',
            message: 'Are you sure you want to remove this receipt item?',
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
                        this.receiveProvider.removeReceiptItem(line, key);
                    }
                }
            ]
        });
        alert.present();
    }

}
