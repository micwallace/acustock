/*
 * This file is part of AcuStock
 * Copyright (c) 2018 Michael B Wallace
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Component, OnInit } from '@angular/core';
import { Events } from 'ionic-angular'

@Component({
    selector: 'barcode-listener',
    templateUrl: 'barcode-listener.component.html'
})

export class BarcodeListenerComponent implements OnInit {

    currentTime = 0;
    currentTimeDiff = 0;
    previousTimeDiff = 0;
    currentKey:string;
    previousKey:string;
    outputString:string = '';

    listenersAdded = false;

    constructor(public events: Events) {

    }

    ngOnInit() {
        if (!this.listenersAdded) {
            this.listenersAdded = true;

            document.addEventListener('keypress', (e)=> {
                this.keypressHandler(e);
            });

            document.addEventListener('keydown', (e)=> {
                if (this.outputString != "" && (e.key == "Enter" || e.key == "Tab"))
                    this.keypressHandler(e);
            });
        }
    }

    keypressHandler(e:any) {
        let timestamp = new Date().getTime();
        this.previousKey = this.currentKey;
        this.currentKey = e.key;

        //console.log(e.key);

        if (this.currentTime) {
            this.previousTimeDiff = this.currentTimeDiff;
            this.currentTimeDiff = timestamp - this.currentTime;
        }

        this.currentTime = timestamp;

        //console.log(this.currentTimeDiff)
        //console.log("Key press: "+ e.key);

        //if either the current time diff is less than 15, or the current time diff is less than 15
        //and the previous time diff was greater than 15. This is in the case where there is certainly a longer
        //period between scans
        if ((this.currentTimeDiff <= 25) || (this.currentTimeDiff <= 25 && this.previousTimeDiff >= 28)) {
            //We must initially evaluate the previous and current time diffs. This is how we know a scan has started,
            //because the second time diff will be very low, while the first will be very high, because a human cannot scan
            //something is less than 15 milliseconds
            if (this.currentTimeDiff <= 25 && this.previousTimeDiff >= 28) {
                this.outputString = '';
                this.outputString += this.previousKey;
                this.outputString += this.currentKey;
            }

            //If they are both less than 15, we know we are beyond the first characters,
            //and we may start only adding the current character. Also, the current code cannot
            //be Enter, because that is when we need to emit the outputString
            if (this.currentTimeDiff <= 25 && this.previousTimeDiff <= 25 && e.key != 'Enter' && e.key != 'Tab') {
                this.outputString += this.currentKey;
                // This prevents active element such as buttons from triggering their click event when the enter key is pressed.
                (document.activeElement as HTMLElement).blur();
            }

            //If we are in the middle of the scan and the code is 13, we can stop adding to the
            //outputString and emit it instead. We must then set is back to empty for the next scan.
            if (this.currentTimeDiff <= 25 && this.previousTimeDiff <= 25 && (e.key == 'Enter' || e.key == 'Tab') && this.outputString !== '') {
                this.events.publish('barcode:scan', this.outputString);
                this.outputString = '';
            }

        }

    }


}
