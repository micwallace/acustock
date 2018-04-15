import { Component } from '@angular/core';
import { NavController, ModalController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { PickProvider } from '../../providers/providers';
import { PickShipmentsListPage } from "../pick-shipments-list/pick-shipments-list";
import { PickShipmentsPickPage } from "../pick-shipments-pick/pick-shipments-pick";

@Component({
    selector: 'page-pick-shipments',
    templateUrl: 'pick-shipments.html'
})
export class PickShipmentsPage {

    totalItems = 0;
    unpickedItems = 0;

    constructor(public navCtrl:NavController, private barcodeScanner:BarcodeScanner, public pickProvider: PickProvider, public modalCtrl:ModalController) {
        if (pickProvider.currentShipment)
            this.calculateItems();
    }

    scanShipment() {
        this.barcodeScanner.scan().then((barcodeData) => {
            if (barcodeData.cancelled)
                return;

            this.loadShipment(barcodeData.text);

        }, (err) => {
            // An error occurred
            alert("Error accessing barcode device: " + err);
        });
    }

    loadShipment(shipmentNbr){
        this.pickProvider.loadShipment(shipmentNbr).then((res)=>{
            if (res)
                this.calculateItems();
        });
    }

    calculateItems(){
        console.log("Items calculated");

        this.totalItems = 0;
        this.unpickedItems = 0;

        for (var i=0; i<this.pickProvider.currentShipment.Details.length; i++){

            var item = this.pickProvider.currentShipment.Details[i];
            this.totalItems += item.ShippedQty.value;

            for (var x=0; x<item.Allocations.length; x++){
                // TODO: get current warehouse shipping location
                if (item.Allocations[x].LocationID.value !== "SHIPPING")
                    this.unpickedItems += item.Allocations[x].Qty.value
            }
        }
    }

    openItemsDialog(){
        console.log(JSON.stringify(this.pickProvider.currentShipment.Details));

        let modal = this.modalCtrl.create(PickShipmentsListPage);
        modal.present();
    }

    openPickDialog(){
        if (this.unpickedItems == 0){
            alert("There are no items left to pick.");
            return;
        }

        let modal = this.modalCtrl.create(PickShipmentsPickPage);
        modal.present();
    }

}
