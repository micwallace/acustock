import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { TransferProvider } from '../../../providers/app/transfer'
import { UtilsProvider } from "../../../providers/core/utils";

/**
 * Generated class for the PickShipmentsListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-bin-transfer',
    templateUrl: 'transfer-list.html'
})
export class TransferListTab {

    objectKeys:any = Object.keys;

    constructor(public navCtrl:NavController,
                public navParams:NavParams,
                public transferProvider:TransferProvider,
                public alertController:AlertController,
                public utils:UtilsProvider) {
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad PickShipmentPickPage Tab: Pick List');
    }

    openEditDialog(locationKey, itemKey) {

        var location = this.transferProvider.getPendingItem(locationKey);
        var curItemQty = location.Items[itemKey].Qty.value;

        var alertDialog = this.alertController.create({
            title: 'Update Qty',
            inputs: [
                {
                    name: 'qty',
                    placeholder: 'Quantity',
                    value: curItemQty
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
                    text: 'Update',
                    handler: data => {
                        var qty = parseFloat(data.qty);
                        var curPending = this.transferProvider.getItemLocPendingQty(locationKey.split("#")[0], itemKey);
                        var srcQty = location.srcQty;

                        var newPending = (qty - curItemQty) + curPending;

                        if (newPending <= srcQty) {
                            this.transferProvider.updatePendingItemQty(locationKey, itemKey, qty);
                        } else {
                            this.utils.showAlert("Error", "There is only " + srcQty + " on hand to transfer from this location.");
                        }
                    }
                }
            ]
        });
        alertDialog.present();
    }

    deleteItem(locationKey, itemKey) {

        if (!confirm("Are you sure?"))
            return;

        this.transferProvider.removePendingItem(locationKey, itemKey);
    }

}
