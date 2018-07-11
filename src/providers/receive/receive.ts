import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

/*
 Generated class for the ReceiveProvider provider.

 See https://angular.io/guide/dependency-injection for more info on providers
 and Angular DI.
 */
@Injectable()
export class ReceiveProvider {

    public currentReceipt = null;

    constructor(public http:HttpClient) {
        console.log('Hello ReceiveProvider Provider');
    }

    public loadReceipt(receiptNbr, selectedType) {

        return new Promise((resolve, reject)=> {

            var types = ['shipment', 'purchase', 'transfer'];

            // Move the currently selected type onto the front of the list
            var first = types.splice(types.indexOf(selectedType), 1);
            types.unshift(first);

            for (let type of types){

            }

        });

    }

}
