import { Injectable } from '@angular/core';
import { Api } from '../../providers/api/api'
import { CacheProvider } from '../../providers/cache/cache'
import { LoadingController } from 'ionic-angular';

/*
  Generated class for the PickProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class PickProvider {

  public currentShipment;

  public unpickedItems = [];

  public pickedItems = [];

  constructor(public api: Api, public cache: CacheProvider, public loadingCtrl: LoadingController) {
    console.log('Hello PickProvider Provider');
  }

  public loadShipment(shipmentNbr){

    return new Promise((resolve, reject)=>{

      if (!shipmentNbr){
        alert("Please enter a valid shipment number");
        resolve(false);
        return;
      }

      let loader = this.loadingCtrl.create({content: "Loading..."});
      loader.present();

      this.api.getShipment(shipmentNbr).then((res:any) => {

        loader.dismiss();

        if (res.length == 0){
          alert("Shipment #"+shipmentNbr+" was not found in the system.");
          resolve(false);
          return;
        }

        let shipment = res[0];

        // TODO add warehouse check
        var curWarehouse = "WHOLESALE";
        if (shipment.WarehouseID.value !== curWarehouse){
          alert("Shipment #"+shipmentNbr+" was found but belongs to warehouse " + shipment.WarehouseID.value + ", not the currently selected warehouse which is " + curWarehouse);
          resolve(false);
          return;
        }

        this.currentShipment = shipment;

        for (var i=0; i<this.currentShipment.Details.length; i++){

          var item = this.currentShipment.Details[i];

          if (item.LocationID.value == "SHIPPING")
              continue;

          var unpicked = Object.assign({}, item);
          unpicked.Allocations = [];
          unpicked.PickedQty = 0;

          for (var x=0; x<item.Allocations.length; x++){
            // TODO: get current warehouse shipping location
            if (item.Allocations[x].LocationID.value !== "SHIPPING") {
              unpicked.Allocations.push(item.Allocations[x]);
            } else {
              unpicked.PickedQty += item.ShippedQty.value;
            }
          }

          if (unpicked.Allocations.length > 0) {
            this.unpickedItems.push(unpicked);
          }
        }

        resolve(true);

      }).catch((err) => {
        loader.dismiss();
        alert(err.message);
        resolve(false);
      });
    });

  }

  /*private getPickedItem(itemId){
    for (let item of this.pickedItems){
      if (itemId == item.InventoryID.value){
        return item;
      }
    }
    return null;
  }*/

  public addPick(itemId, data){
    // check for existing item
    for (let item of this.pickedItems){
      if (itemId == item.InventoryID.value){

        item.Allocations.push(data);
        return;
      }
    }

    for (let item of this.unpickedItems){
      if (itemId == item.InventoryID.value){

        item.Allocations = [data];
        this.pickedItems.push(item);
        return;
      }
    }
  }

  public confirmPicks(){

  }


}
