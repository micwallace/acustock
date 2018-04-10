import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { PickProvider } from '../../../providers/providers';
import { CacheProvider } from "../../../providers/cache/cache";

/**
 * Generated class for the PickShipmentsPickPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'tabs-pick',
  templateUrl: 'pick.html'
})
export class PickTab {

  @ViewChild('location') locationInput;
  @ViewChild('item') itemInput;
  @ViewChild('lot') lotInput;
  @ViewChild('qty') qtyInput;

  currentItemIndex = 0;
  currentAllocationIndex = 0;

  currentPickItem = {

  };

  enteredData = {
    location: "",
    item: "",
    lot: "",
    qty: ""
  };

  showLot = false;
  showQty = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, public pickProvider: PickProvider, public cache: CacheProvider) {

  }

  getCurrentItem(){

    if (!this.pickProvider.unpickedItems)
        return null;

    return this.pickProvider.unpickedItems[this.currentItemIndex];
  }

  getCurrentItemAllocation(){
    return this.pickProvider.unpickedItems[this.currentItemIndex].Allocations[this.currentAllocationIndex];
  }

  getCurrentItemPickedQty(){
    var picked = this.getCurrentItem().PickedQty;
    var itemId = this.getCurrentItem().InventoryID.value;

    // add uncommitted picks
    for (let item of this.pickProvider.pickedItems){
      if (itemId == item.InventoryID.value){
        for (let allocation of item.Allocations){
          picked += allocation.Qty.value;
        }
        break;
      }
    }

    return picked;
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad PickShipmentsPickPage Tab: Pick');
    //document.getElementById("location").focus();
    setTimeout(()=>{
      this.locationInput.setFocus();
    }, 150);
  }

  nextItem(){
    if (this.currentAllocationIndex + 1 < this.getCurrentItem().Allocations.length){

      this.currentAllocationIndex++;

    } else if (this.currentItemIndex + 1 < this.pickProvider.unpickedItems.length) {

      this.currentAllocationIndex = 0;
      this.currentItemIndex++;

    } else {

      this.currentAllocationIndex = 0;
      this.currentItemIndex = 0;
    }
  }

  previousItem(){
    if (this.currentAllocationIndex - 1 > -1){

      this.currentAllocationIndex--;

    } else if (this.currentItemIndex - 1 > -1) {

      this.currentItemIndex--;
      this.currentAllocationIndex = this.getCurrentItem().Allocations.length - 1;

    } else {

      this.currentItemIndex = this.pickProvider.unpickedItems.length - 1;
      this.currentAllocationIndex = this.getCurrentItem().Allocations.length - 1;
    }
  }

  resetCurrentPick(){
    this.currentPickItem = Object.assign({}, this.getCurrentItemAllocation());
  }

  setLocation(){
    var curBin = this.getCurrentItemAllocation().LocationID.value;
    var enteredBin = this.enteredData.location;
    if (curBin != enteredBin){
      alert(enteredBin + " is not the recommended bin " + curBin);
      return;
      // TODO: allow location overide
    }

    //document.getElementById("item").focus();
    this.itemInput.setFocus();
  }

  setItem(){
    var curItem = this.getCurrentItem();
    var enteredItem = this.enteredData.item;

    this.cache.getItemById(enteredItem).then((item)=>{

      if (item.InventoryID.value != curItem.InventoryID.value){
        alert("The entered item does not match the requested item.");
        return;
      }

      this.showQty = true;
      this.enteredData.item = item.InventoryID.value;
      //document.getElementById("qty").focus();
      setTimeout(()=> {
        this.qtyInput.setFocus();
      });

    }).catch((err)=>{
      alert(err.message);
    });
  }

  setLotSerial(){

  }

  setQuantity(){
    var curQty = this.getCurrentItemAllocation().Qty.value;
    var enteredQty = this.enteredData.qty;

    if (curQty != enteredQty){
      alert("The entered qty is not the suggested qty");
      return;
      // TODO: allow qty overide
    }

    this.addItemPick();
  }

  addItemPick(){
    // TODO: validation

    var itemId = this.getCurrentItem().InventoryID.value;

    var data = {
      LocationID: {value: this.enteredData.location},
      InventoryID: {value: itemId},
      LotSerialNbr: {value: this.enteredData.lot},
      Qty: {value: this.enteredData.qty},
    };

    this.pickProvider.addPick(itemId, data);
    this.enteredData = {
      location: "",
      item: "",
      lot: "",
      qty: ""
    };

    // If the whole qty is picked remove the item from the unpicked list, otherwise move to the next suggested allocation
    if (this.getCurrentItemPickedQty() < this.getCurrentItem().ShippedQty.value){
      // TODO: check if suggested allocations have become exhausted.
      this.nextItem();
    } else {
      this.currentAllocationIndex = 0;
      this.pickProvider.unpickedItems.splice(this.currentItemIndex, 1);
    }

    this.locationInput.setFocus();

  }

}
